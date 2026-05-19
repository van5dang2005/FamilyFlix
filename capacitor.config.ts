import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.familyflix.app',
  appName: 'FamilyFlix',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
