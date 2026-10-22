import React, { useState } from 'react';
import { registerRootComponent } from 'expo';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PreferencesProvider, usePreferences } from '../../src/context/PreferencesContext';
import '../../src/i18n';
import { QRCheckInScreen } from '../../src/screens/QRCheckInScreen';
import { AppButton } from '../../src/components/AppButton';
import { PaymentProcessingScreen } from '../../src/screens/PaymentProcessingScreen';
import { PriceChangedModal } from '../../src/components/booking-confirmation/PriceChangedModal';
import { OverlappingBookingModal } from '../../src/components/booking-confirmation/OverlappingBookingModal';
import { BookingSuccessGuideCard } from '../../src/components/booking-success/BookingSuccessGuideCard';
import { AvatarViewerModal } from '../../src/components/AvatarViewerModal';
import { booking, setOutcome } from './bookingService.fixture';

const Stack = createNativeStackNavigator();
function Home() { return <Text>Fixture home</Text>; }
function Fixtures() {
  const [scene, setScene] = useState('FAILED');
  const [run, setRun] = useState(0);
  const [event, setEvent] = useState('None');
  const { themeColors, setLanguage, setAppearance } = usePreferences();
  const select = value => { setOutcome(value); setScene(value); setRun(n => n + 1); };
  const button = (label, onPress) => <Pressable key={label} accessibilityRole="button" onPress={onPress} style={{ minHeight: 48, padding: 12, borderWidth: 1, borderColor: themeColors.border }}><Text style={{ color: themeColors.textStrong }}>{label}</Text></Pressable>;
  return <View style={{ flex: 1, backgroundColor: themeColors.background }}>
    <Text style={{ color: themeColors.textStrong }}>ISOLATED UI FIXTURES — no API commands</Text>
    <ScrollView horizontal style={{ flexGrow: 0, maxHeight: 64 }} contentContainerStyle={{ gap: 8, padding: 8 }}>
      {['FAILED', 'TIMEOUT', 'CANCELLED', 'processing', 'price', 'overlap', 'guide', 'avatar', 'avatar-image', 'qr-permission', 'qr-confirm', 'qr-wrong', 'button'].map(value => button(value, () => select(value)))}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {['vi', 'en'].map(value => button(value, () => setLanguage(value)))}
      {['light', 'dark'].map(value => button(value, () => setAppearance(value)))}
    </View>
    <Text style={{ color: themeColors.textStrong }}>Fixture event: {event}</Text>
    <View style={{ flex: 1 }}>
      {['FAILED', 'TIMEOUT', 'CANCELLED', 'processing'].includes(scene) ?
        <NavigationContainer key={run}><Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="PaymentProcessing" component={PaymentProcessingScreen} initialParams={{ bookingId: booking.id }} /><Stack.Screen name="Tabs" component={Home} /></Stack.Navigator></NavigationContainer> :
        scene.startsWith('qr-') ? <NavigationContainer key={run}><Stack.Navigator screenOptions={{headerShown:false}}><Stack.Screen name="QRCheckIn" component={QRCheckInScreen} initialParams={{bookingId:booking.id}}/></Stack.Navigator></NavigationContainer> :
        scene === 'button' ? <ScrollView contentContainerStyle={{padding:16,gap:16,maxWidth:320}}><AppButton label="Confirm the updated charging reservation and continue with this payment method" icon="arrow-forward" onPress={()=>setEvent('long label clicked')} /><AppButton label="Custom height with a long label that must wrap without clipping inside a narrow container" style={{height:52}}/><AppButton label="Disabled action" disabled/><AppButton label="Loading action" loading/></ScrollView> :
        scene === 'guide' ? <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}><BookingSuccessGuideCard /></ScrollView> : null}
    </View>
    <PriceChangedModal visible={scene === 'price'} oldPrice={1234567} pendingPricePreview={{ totalAmount: 2345678 }} onAccept={() => setEvent('price accepted locally')} onDecline={() => select('FAILED')} />
    <OverlappingBookingModal visible={scene === 'overlap'} overlappingBooking={booking} onConfirm={() => setEvent('overlap confirmed locally')} onCancel={() => select('FAILED')} />
    <AvatarViewerModal visible={scene === 'avatar' || scene === 'avatar-image'} avatarUrl={scene === 'avatar-image' ? 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="400" height="240" fill="#087f5b"/><circle cx="200" cy="120" r="80" fill="#ffffff"/><path d="M0 120H400M200 0V240" stroke="#f59f00" stroke-width="10"/></svg>') : undefined} displayName="Responsive Fixture" onClose={() => select('FAILED')} onEdit={() => setEvent('edit locally')} />
  </View>;
}
function App() { return <SafeAreaProvider><PreferencesProvider><Fixtures /></PreferencesProvider></SafeAreaProvider>; }
registerRootComponent(App);
