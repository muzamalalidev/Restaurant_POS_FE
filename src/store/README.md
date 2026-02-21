# Redux Store (RTK Query)

## Quick Start

### ✅ What's Already Done

1. **Redux Toolkit & RTK Query installed**
2. **Store configured** (`src/store/index.js`)
3. **Base API setup** (`src/store/api/base-api.js`)
4. **Redux Provider added** to `app/layout.jsx`
5. **Example API slice** (`src/store/api/example-api.js`)

### 🎯 Current Status

- ✅ **Existing SWR hooks**: Work as before (no changes)
- ✅ **Existing Context API**: Work as before (no changes)
- ✅ **New RTK Query**: Ready to use for new features

---

## Usage

### For New Features

```javascript
// 1. Create API slice
// src/store/api/your-feature-api.js
import { baseApi } from './base-api';

export const yourFeatureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getData: builder.query({
      query: () => '/api/your-endpoint',
      providesTags: ['YourTag'],
    }),
  }),
});

export const { useGetDataQuery } = yourFeatureApi;

// 2. Use in component
import { useGetDataQuery } from 'src/store/api/your-feature-api';

function YourComponent() {
  const { data, isLoading } = useGetDataQuery();
  // ...
}
```

### Existing Features

**No changes needed!** Continue using:
- `useGetProducts()` from `src/actions/product.js`
- `useGetPosts()` from `src/actions/blog.js`
- All other existing SWR hooks

---

## File Structure

```
src/store/
├── index.js              # Store configuration
├── provider.jsx          # Redux Provider component
├── hooks.js             # Typed hooks (useAppDispatch, useAppSelector)
├── README.md            # This file
├── RTK_QUERY_GUIDE.md   # Detailed guide
└── api/
    ├── base-api.js      # Base RTK Query API
    └── example-api.js   # Example endpoints
```

---

## Important Notes

1. **No Breaking Changes**: All existing code works as before
2. **Gradual Adoption**: Use RTK Query only for NEW features
3. **Coexistence**: SWR and RTK Query work together without conflicts

---

## See Also

- `RTK_QUERY_GUIDE.md` - Detailed documentation
- `src/components/rtk-query-example.jsx` - Usage example

