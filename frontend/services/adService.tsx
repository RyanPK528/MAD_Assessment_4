/**
 * Ad Service
 * Uses a WebView to display Google AdSense test ads.
 * Works in both Expo Go and Development Builds — no native module required.
 *
 * For production, replace the ad HTML with your real AdSense/Ad Manager unit.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

// A simple ad HTML that displays a styled test banner
const AD_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #f0f4f8;
      font-family: -apple-system, sans-serif;
    }
    .ad-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      padding: 10px;
    }
    .ad-text {
      color: white;
      font-size: 14px;
      font-weight: 600;
      text-align: center;
      line-height: 1.4;
    }
    .ad-label {
      position: absolute;
      top: 4px;
      left: 8px;
      font-size: 9px;
      color: rgba(255,255,255,0.7);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="ad-container">
    <span class="ad-label">Ad</span>
    <span class="ad-text">STEMM Lab Sponsor<br/>Learn Science with Fun!</span>
  </div>
</body>
</html>
`;

/**
 * Banner ad component using WebView.
 * Displays a test ad banner that works everywhere.
 */
export function AdBannerView() {
  const [loaded, setLoaded] = useState(false);

  // WebView doesn't work well on web platform
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: AD_HTML }}
        style={[styles.webview, !loaded && styles.hidden]}
        scrollEnabled={false}
        onLoadEnd={() => setLoaded(true)}
        javaScriptEnabled={false}
        originWhitelist={['*']}
      />
    </View>
  );
}

/**
 * Hook stub for interstitial ads.
 * In a production app with a dev build, you'd use a proper native ad SDK.
 * For now this is a no-op placeholder.
 */
export function useInterstitialAd() {
  return {
    showAd: () => {
      // No-op in WebView-based implementation
    },
    isLoaded: false,
    isAvailable: !IS_EXPO_GO,
  };
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  hidden: {
    opacity: 0,
  },
});
