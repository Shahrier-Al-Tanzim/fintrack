  import { StatusBar } from 'expo-status-bar';
  import { Provider } from 'react-redux';
  import { store } from './src/stores';
  import AppNavigator from './src/navigation/AppNavigator';
  import * as Sentry from '@sentry/react-native';

  Sentry.init({
    dsn: 'https://47ff0e50c78c41a0ed87105fc7639429@o4511332838866944.ingest.us.sentry.io/4511332845420544',
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
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