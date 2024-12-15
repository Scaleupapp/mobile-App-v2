import React from 'react';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import {RootNavigator} from './src/navigations';
import {ToastProvider} from './src/components/CustomToast';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import reduxStore from './src/redux/store';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';

export const navigationRef = createNavigationContainerRef();

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <Provider store={reduxStore}>
          <NavigationContainer ref={navigationRef}>
            <SafeAreaProvider>
              <ToastProvider>
                <RootNavigator />
              </ToastProvider>
            </SafeAreaProvider>
          </NavigationContainer>
        </Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

export default App;
