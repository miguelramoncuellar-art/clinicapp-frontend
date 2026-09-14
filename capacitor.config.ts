import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clinicapp.app',
  appName: 'ClinicApp',
  webDir: 'dist/clinicapp-frontend/browser',
  server: {
    // Sirve la WebView por http:// en vez de https:// para evitar el bloqueo
    // de mixed content al llamar a un backend HTTP plano. Solo desarrollo.
    androidScheme: 'http',
  },
};

export default config;