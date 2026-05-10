import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.hourly',
  appName: 'Hourly',
  webDir: 'dist',
  ios: {
    contentInset: 'always'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_hourly',
      iconColor: '#111111'
    }
  }
};

export default config;
