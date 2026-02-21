'use client';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

/**
 * Tenant Status Badge Component
 * 
 * Displays tenant active/inactive status with appropriate styling.
 */
export function TenantStatusBadge({ isActive }) {
  return (
    <Label color={isActive ? 'success' : 'default'} variant="soft">
      {isActive ? 'Active' : 'Inactive'}
    </Label>
  );
}

