import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.binge.app',
  appName: 'Binge',
  webDir: 'dist/binge/browser',
server: {
  url: 'http://192.168.0.118:4200', // Use your local IP address here
  cleartext: true
}
}
export default config;
