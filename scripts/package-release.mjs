import { readFile } from 'node:fs/promises';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const repoRoot = resolve(import.meta.dirname, '..');

async function packageRelease() {
  execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' });

  const packageJson = JSON.parse(await readFile(resolve(repoRoot, 'package.json'), 'utf8'));
  const version = packageJson.version;
  const releaseDir = resolve(repoRoot, 'release');
  const zipPath = resolve(releaseDir, `playback-controls-for-youtube-tm-v${version}-chrome-store.zip`);
  const distDir = resolve(repoRoot, 'dist');

  await mkdir(releaseDir, { recursive: true });
  await rm(zipPath, { force: true });

  execSync(
    `Compress-Archive -Path "${distDir}\\*" -DestinationPath "${zipPath}" -Force`,
    { cwd: repoRoot, stdio: 'inherit', shell: 'powershell.exe' }
  );

  console.log(`Release package created: ${zipPath}`);
}

await packageRelease();