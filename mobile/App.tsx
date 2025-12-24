
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const WEB_URL = 'https://yourapp.com'; // your PWA URL

export default function App() {
  const [loading, setLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const webRef = useRef<WebView | null>(null);

  useEffect(() => {
    registerForPush().then((token) => {
      if (token) {
        setPushToken(token);
        // send token to your backend
        fetch(`${WEB_URL}/api/mobile/push-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }).catch(() => {});
      }
    });

    const sub = Notifications.addNotificationReceivedListener((notification) => {
      // Optionally forward to WebView via postMessage
      webRef.current?.postMessage(
        JSON.stringify({ type: 'PUSH_NOTIFICATION', payload: notification.request.content })
      );
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {loading && (
        <ActivityIndicator style={{ position: 'absolute', top: '50%', left: '50%' }} />
      )}
      <WebView
        ref={webRef}
        source={{ uri: WEB_URL }}
        onLoadEnd={() => setLoading(false)}
        originWhitelist={['*']}
        sharedCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
      />
    </SafeAreaView>
  );
}

async function registerForPush() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}
