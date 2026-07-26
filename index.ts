import * as Sentry from '@sentry/react-native';
import { registerRootComponent } from 'expo';

import App from './App';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
const configuredEnvironment = process.env.EXPO_PUBLIC_APP_ENVIRONMENT?.trim();
const sentryEnvironment = configuredEnvironment || (__DEV__ ? "development" : "production");
const isProduction = !__DEV__ && sentryEnvironment === "production";

Sentry.init({
  attachStacktrace: true,
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn) && isProduction,
  environment: sentryEnvironment,
  sendDefaultPii: false
});

registerRootComponent(Sentry.wrap(App));
