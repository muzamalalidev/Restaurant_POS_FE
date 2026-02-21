# RTK Query Integration Guide

## Overview

This project now supports **hybrid data fetching**:
- ✅ **Existing**: Context API + SWR (unchanged, continues to work)
- ✅ **New**: RTK Query (for new features)

Both can coexist without conflicts!

---

## Architecture

```
┌─────────────────────────────────────┐
│   Root Layout (app/layout.jsx)      │
├─────────────────────────────────────┤
│  ReduxProvider (NEW)                │
│  ├─ JwtAuthProvider (EXISTING)     │
│  ├─ SettingsProvider (EXISTING)     │
│  └─ ... other Context providers    │
└─────────────────────────────────────┘
```

**Important**: Redux Provider wraps existing Context providers, so:
- ✅ All existing Context APIs work as before
- ✅ All existing SWR hooks work as before
- ✅ New RTK Query hooks work alongside them

---

## When to Use What?

### Use SWR (Existing) ✅
- **Keep using** for existing features:
  - `useGetProducts()` - Product listing
  - `useGetPosts()` - Blog posts
  - `useGetBoard()` - Kanban board
  - `useGetEvents()` - Calendar events
  - `useGetContacts()` - Chat contacts
  - All other existing hooks in `src/actions/`

### Use RTK Query (New) 🆕
- **Use for** all NEW features:
  - New API endpoints
  - New data fetching requirements
  - Complex state management needs
  - Features requiring optimistic updates
  - Features needing advanced caching

---

## Creating New RTK Query Endpoints

### Step 1: Create API Slice

```javascript
// src/store/api/notifications-api.js
import { baseApi } from './base-api';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params) => ({
        url: '/api/notifications',
        params,
      }),
      providesTags: ['Notification'],
    }),
    
    createNotification: builder.mutation({
      query: (data) => ({
        url: '/api/notifications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useCreateNotificationMutation,
} = notificationsApi;
```

### Step 2: Use in Components

```javascript
// src/components/notifications/notification-list.jsx
'use client';

import { useGetNotificationsQuery } from 'src/store/api/notifications-api';

export function NotificationList() {
  const { data, isLoading, error } = useGetNotificationsQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.notifications?.map((notification) => (
        <div key={notification.id}>{notification.message}</div>
      ))}
    </div>
  );
}
```

---

## Migration Strategy

### Phase 1: Current (✅ Done)
- ✅ RTK Query installed and configured
- ✅ Redux Provider added to layout
- ✅ Base API setup complete
- ✅ Example API slice created

### Phase 2: New Features (🔄 In Progress)
- Use RTK Query for all NEW features
- Keep existing SWR implementations unchanged

### Phase 3: Gradual Migration (Future - Optional)
- Only migrate if needed
- Migrate one feature at a time
- Test thoroughly before removing SWR

---

## Best Practices

### 1. Naming Convention
- RTK Query hooks: `useGetXQuery`, `useCreateXMutation`
- SWR hooks: `useGetX` (existing pattern)

### 2. File Organization
```
src/store/
├── index.js              # Store configuration
├── provider.jsx         # Redux Provider
├── hooks.js             # Typed hooks
└── api/
    ├── base-api.js      # Base RTK Query API
    ├── example-api.js   # Example endpoints
    └── [feature]-api.js # Feature-specific APIs
```

### 3. Cache Management
- Use `providesTags` for cache identification
- Use `invalidatesTags` for cache invalidation
- RTK Query automatically handles caching

### 4. Error Handling
```javascript
const { data, error, isLoading } = useGetNotificationsQuery();

if (error) {
  // Handle error
  console.error('Failed to fetch:', error);
}
```

---

## Comparison: SWR vs RTK Query

| Feature | SWR (Existing) | RTK Query (New) |
|---------|---------------|-----------------|
| **Caching** | Automatic | Automatic + Advanced |
| **Mutations** | Manual (`mutate`) | Built-in mutations |
| **Optimistic Updates** | Manual | Built-in support |
| **Cache Invalidation** | Manual | Automatic with tags |
| **DevTools** | Limited | Redux DevTools |
| **Bundle Size** | ~5KB | ~15KB |
| **Learning Curve** | Easy | Moderate |

---

## Example: Side-by-Side Usage

```javascript
'use client';

// Existing SWR hook (unchanged)
import { useGetProducts } from 'src/actions/product';

// New RTK Query hook
import { useGetNotificationsQuery } from 'src/store/api/notifications-api';

export function Dashboard() {
  // ✅ Existing SWR - works as before
  const { products, productsLoading } = useGetProducts();
  
  // 🆕 New RTK Query - works alongside
  const { data: notifications, isLoading: notificationsLoading } = 
    useGetNotificationsQuery();
  
  return (
    <div>
      {/* Both work together! */}
      <ProductsList products={products} loading={productsLoading} />
      <NotificationsList notifications={notifications} loading={notificationsLoading} />
    </div>
  );
}
```

---

## Troubleshooting

### Issue: Redux Provider not working
**Solution**: Check that `ReduxProvider` is in `app/layout.jsx` and wraps your components.

### Issue: Existing SWR hooks broken
**Solution**: They shouldn't be! Redux Provider doesn't affect SWR. Check for other issues.

### Issue: RTK Query not fetching
**Solution**: 
1. Check `base-api.js` configuration
2. Verify API endpoint URLs
3. Check browser console for errors

---

## Resources

- [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [SWR Docs](https://swr.vercel.app/) (for existing implementations)

---

## Questions?

- ✅ Existing features: Continue using SWR
- 🆕 New features: Use RTK Query
- 🔄 Migration: Only if needed, one feature at a time

**Remember**: Both can coexist! No need to migrate everything at once.

