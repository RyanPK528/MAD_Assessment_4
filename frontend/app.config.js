require('dotenv').config();

const appJson = require('./app.json');

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
      EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
    },
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...(appJson.expo.ios?.infoPlist ?? {}),
        NSCameraUsageDescription: 'STEMM Lab uses the camera to record parachute drop videos for slow-motion analysis.',
        NSMicrophoneUsageDescription: 'STEMM Lab uses the microphone to measure classroom sound levels.',
        NSLocationWhenInUseUsageDescription: 'STEMM Lab tags activity results with your location for sound zone mapping.',
        bundleIdentifier: 'com.anonymous.frontend',
      },
    },
    android: {
      ...appJson.expo.android,
      permissions: [
        ...(appJson.expo.android?.permissions ?? []),
        'CAMERA',
        'RECORD_AUDIO',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
      ],

      package: 'com.anonymous.frontend',
    },
    plugins: [
      ...appJson.expo.plugins,
      'expo-sqlite',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow STEMM Lab to record parachute drop videos.',
          microphonePermission: 'Allow STEMM Lab to record audio with videos.',
          recordAudioAndroid: true,
          recordAudioIOS: true,
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Allow STEMM Lab to measure classroom sound levels.',
        },
      ],
    ],
  },
};

