  import { StatusBar } from 'expo-status-bar';
  import { Provider } from 'react-redux';
  import { store } from './src/stores';
  import AppNavigator from './src/navigation/AppNavigator';
  import * as Sentry from '@sentry/react-native';
  import { API_BASE_URL } from './src/services/api';

  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    // Use a tunnel to bypass ad-blockers in both local and production environments
    tunnel: `${API_BASE_URL}/sentry-tunnel`,
    tracesSampleRate: 1.0,
  });

  function App() {
    return (
      // The Provider still wraps everything, giving the app a memory
      <Provider store={store}>
        {/* The Navigator now controls what screen is actually displayed */}
        <AppNavigator />
        <StatusBar style="light" />
      </Provider>
    );
  }

  export default Sentry.wrap(App);