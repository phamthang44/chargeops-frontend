// Synthetic camera surface. Never opens hardware or browser permission prompts.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { getOutcome } from './bookingService.fixture';
export function useCameraPermissions() {
  return [{ granted: getOutcome() !== 'qr-permission', canAskAgain: false }, async () => {}];
}
export function CameraView({ style, onBarcodeScanned }) {
  return <View style={[style, { backgroundColor: '#102b21', justifyContent: 'flex-start', alignItems: 'center' }]}>
    <Pressable accessibilityRole="button" accessibilityLabel="Scan fixture QR" onPress={() => onBarcodeScanned?.({ data: 'ui-only-qr' })} style={{ padding: 12, minHeight: 48, backgroundColor: '#fff', zIndex: 20 }}><Text>Scan fixture QR</Text></Pressable>
  </View>;
}
