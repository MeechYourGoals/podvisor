import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.167f3bd6b2ca46b69ba97cfb4745593b',
  appName: 'podvisor',
  webDir: 'dist',
  server: {
    url: 'https://167f3bd6-b2ca-46b6-9ba9-7cfb4745593b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#0f172a'
    }
  }
};

export default config;
