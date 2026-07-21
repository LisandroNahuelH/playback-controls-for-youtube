import { defineManifest } from '@crxjs/vite-plugin';

const matches = ['https://*.youtube.com/*', 'https://youtube.com/*'];

export default defineManifest({
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extName__',
  version: '0.3.9',
  description: '__MSG_extDescription__',
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png'
  },
  action: {
    default_title: '__MSG_extActionTitle__',
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    }
  },
  permissions: ['storage'],
  content_scripts: [
    {
      matches,
      js: ['src/content/index.iife.ts'],
      run_at: 'document_idle'
    }
  ]
});
