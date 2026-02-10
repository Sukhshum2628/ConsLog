import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.conslog.app',
  appName: 'TimeLog',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '680232483390-4v6k3u899d13poflit6hf614ttrl01ge.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
