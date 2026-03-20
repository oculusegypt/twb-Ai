import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Unique app identifier — change this to your own reverse-domain ID before publishing
  appId: 'com.tawbah.guide',
  appName: 'دليل التوبة النصوح',

  // Points to the built web assets (output of `pnpm build`)
  webDir: 'dist/public',

  server: {
    // Forces HTTPS scheme on Android WebView for secure cookie handling
    androidScheme: 'https',
  },

  android: {
    // Allow the app to use cleartext traffic only in development
    allowMixedContent: false,
    // Keep the status bar visible (content flows under it via safe-area CSS)
    captureInput: false,
  },

  plugins: {
    // ── Camera (for future use) ────────────────────────────────────────────────
    // Usage: import { Camera } from '@capacitor/camera';
    // See: https://capacitorjs.com/docs/apis/camera
    Camera: {
      // Android: request camera permissions automatically on first use
    },

    // ── Bluetooth LE (for future use) ──────────────────────────────────────────
    // Usage: import { BleClient } from '@capacitor-community/bluetooth-le';
    // See: https://github.com/capacitor-community/bluetooth-le
    BluetoothLe: {
      // Android: add bluetooth permissions to AndroidManifest.xml manually
      // when ready to use. See the plugin docs for required permissions.
    },
  },
};

export default config;
