'use client';

/**
 * Example Component: Using RTK Query alongside SWR
 * 
 * This demonstrates how both can work together:
 * - Existing SWR hooks continue to work
 * - New RTK Query hooks work alongside them
 */

// Existing SWR hook (unchanged)
import { useGetProducts } from 'src/actions/product';
// New RTK Query hook (example)
import { useGetNotificationsQuery } from 'src/store/api/example-api';

// ----------------------------------------------------------------------

export function HybridExample() {
  // ✅ Existing SWR - works as before (no changes needed)
  const { products, productsLoading, productsError } = useGetProducts();

  // 🆕 New RTK Query - works alongside SWR
  const {
    data: notifications,
    isLoading: notificationsLoading,
    error: notificationsError,
  } = useGetNotificationsQuery();

  return (
    <div>
      <h2>Hybrid Approach Example</h2>

      {/* SWR Data */}
      <section>
        <h3>Products (SWR - Existing)</h3>
        {productsLoading ? (
          <p>Loading products...</p>
        ) : productsError ? (
          <p>Error: {productsError.message}</p>
        ) : (
          <ul>
            {products?.map((product) => (
              <li key={product.id}>{product.name}</li>
            ))}
          </ul>
        )}
      </section>

      {/* RTK Query Data */}
      <section>
        <h3>Notifications (RTK Query - New)</h3>
        {notificationsLoading ? (
          <p>Loading notifications...</p>
        ) : notificationsError ? (
          <p>Error: {notificationsError.message}</p>
        ) : (
          <ul>
            {notifications?.notifications?.map((notification) => (
              <li key={notification.id}>{notification.message}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

