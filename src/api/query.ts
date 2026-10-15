import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

/** Shared cache. Server errors with a 4xx status are not retried (they would fail again). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
    },
  },
});
