import { configureStore } from '@reduxjs/toolkit';

import { baseApi } from './api/base-api';

// ----------------------------------------------------------------------

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [baseApi.util.getRunningQueriesThunk.type],
      },
    }).concat(baseApi.middleware),
});

// ----------------------------------------------------------------------

// Type exports (for TypeScript migration in future)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

