  import { StatusBar } from 'expo-status-bar';
  import { Provider } from 'react-redux';
  import { store } from './src/stores';
  import AppNavigator from './src/navigation/AppNavigator';

  export default function App() {
    return (
      // The Provider still wraps everything, giving the app a memory
      <Provider store={store}>
        {/* The Navigator now controls what screen is actually displayed */}
        <AppNavigator />
        <StatusBar style="light" />
      </Provider>
    );
  }