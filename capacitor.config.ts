import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.conslog.app',
  appName: 'TimeLog',
  webDir: 'dist',
  plugins: {

    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["microsoft.com", "google.com"],
    }
  },
};

export default config;
