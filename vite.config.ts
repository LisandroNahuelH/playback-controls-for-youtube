/// <reference types="vitest/config" />

import { crx } from '@crxjs/vite-plugin';
import { defineConfig, type Plugin } from 'vitest/config';
import manifest from './manifest.config';
import fs from 'node:fs';
import path from 'node:path';

function inlineContentScript(): Plugin {
  return {
    name: 'inline-brave-compatible-content-script',
    enforce: 'post',
    async writeBundle(_options, bundle) {
      const outDir = 'dist';
      const assetsDir = path.join(outDir, 'assets');

      // Find the content loader emitted by crxjs (e.g. index.iife.ts-loader-*.js)
      let loaderFileName: string | null = null;
      let mainChunkName: string | null = null;

      for (const [fileName, file] of Object.entries(bundle)) {
        if (fileName.includes('loader') && fileName.endsWith('.js')) {
          loaderFileName = fileName;
          // Parse the import inside the emitted code to find the target
          if (file.type === 'chunk' || 'code' in file) {
            const code = (file as any).code || (file as any).source || '';
            const match = code.match(/chrome\.runtime\.getURL\(["']([^"']+)["']\)/);
            if (match) {
              mainChunkName = match[1].replace(/^assets\//, '');
            }
          }
        }
      }

      if (!loaderFileName) {
        // Fallback: scan disk for any *-loader-*.js
        try {
          const files = fs.readdirSync(assetsDir);
          const candidate = files.find((f) => f.includes('loader') && f.endsWith('.js'));
          if (candidate) loaderFileName = 'assets/' + candidate;
        } catch {}
      }

      if (!loaderFileName) return;

      const loaderPath = path.join(outDir, loaderFileName);
      if (!fs.existsSync(loaderPath)) return;

      let loaderCode = fs.readFileSync(loaderPath, 'utf8');

      // Extract target chunk from loader source if not found
      if (!mainChunkName) {
        const m = loaderCode.match(/getURL\(["'](?:\.\/|assets\/)?([^"']*index\.iife[^"']*\.js)["']\)/);
        if (m) mainChunkName = m[1];
      }

      if (!mainChunkName) {
        // Try any matching main chunk in assets
        try {
          const files = fs.readdirSync(assetsDir);
          const main = files.find((f) => f.includes('index.iife.ts-') && f.endsWith('.js') && !f.includes('loader'));
          if (main) mainChunkName = main;
        } catch {}
      }

      if (!mainChunkName) return;

      const mainPath = path.join(assetsDir, mainChunkName);
      if (!fs.existsSync(mainPath)) return;

      // Use esbuild to properly bundle the ESM chunk(s) into a single classic IIFE script.
      // This removes all `import`/`export`, resolves the fallback, avoids identifier collisions,
      // and produces a file that can be executed directly by the browser as a content script.
      try {
        const esb = await import('esbuild');
        await esb.build({
          entryPoints: [mainPath],
          bundle: true,
          format: 'iife',
          platform: 'browser',
          target: 'es2020',
          outfile: loaderPath,
          logLevel: 'silent'
        });
      } catch (e) {
        console.error('[inline-content] esbuild inlining failed, falling back to raw:', e);
        const raw = fs.readFileSync(mainPath, 'utf8').replace(/^\s*import\s*[^;]+;\s*/m, '');
        fs.writeFileSync(loaderPath, `(function(){'use strict';${raw}})();`, 'utf8');
      }

      // Clean up the now-unnecessary web_accessible_resources entry that the plugin added for the dynamic chunks.
      // The logic is fully inlined into the classic loader script and no longer requires dynamic loading or web access from page.
      const manifestPath = path.join(outDir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const man = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          if (Array.isArray(man.web_accessible_resources)) {
            // Remove entries that only contained our previous content chunks
            man.web_accessible_resources = man.web_accessible_resources.filter((entry: any) => {
              if (!entry || !Array.isArray(entry.resources)) return true;
              const res = entry.resources.filter((r: string) => !/index\.iife\.ts-/.test(r));
              if (res.length === 0) return false;
              entry.resources = res;
              return true;
            });
            if (man.web_accessible_resources.length === 0) {
              delete man.web_accessible_resources;
            }
            fs.writeFileSync(manifestPath, JSON.stringify(man, null, 2), 'utf8');
          }
        } catch (e) {
          // ignore
        }
      }

      // Log for visibility during build
      console.log('[inline-content] Inlined content script for Brave compatibility:', loaderFileName);

      // Delete only the now-redundant content chunk. Shared chunks may still be imported by popup pages.
      try {
        const toDelete = [path.join(assetsDir, mainChunkName)];
        for (const f of toDelete) {
          if (f && fs.existsSync(f)) fs.unlinkSync(f);
        }
      } catch {}
    }
  };
}

export default defineConfig({
  plugins: [crx({ manifest }), inlineContentScript()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts']
  }
});
