import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  // Only initialize Sentry if DSN is provided
  if (dsn) {
    Sentry.init({
      dsn,
      environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Don't send errors in development
      enabled: environment === 'production',
      beforeSend(event, hint) {
        // Filter out errors that aren't useful
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message);
          // Skip ResizeObserver errors (common browser quirk)
          if (message.includes('ResizeObserver')) {
            return null;
          }
        }
        return event;
      },
    });
  } else {
    console.info('Sentry DSN not configured. Error monitoring disabled.');
  }
}

export { Sentry };
