import type { CapacitorConfig } from '@capacitor/cli';

// ВНИМАНИЕ: androidScheme фиксируется ОДИН раз до первого релиза.
// Смена схемы меняет origin WebView, и localStorage пользователей "обнуляется".
const config: CapacitorConfig = {
  appId: 'com.vibecoding.app',
  appName: 'VibeApp',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
