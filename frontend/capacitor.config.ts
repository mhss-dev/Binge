import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.binge.app',
  appName: 'Binge',
  webDir: 'dist/binge/browser',
  server: {
    url: 'https://binge-now.netlify.app/',
    cleartext: true
  }
};
export default config;