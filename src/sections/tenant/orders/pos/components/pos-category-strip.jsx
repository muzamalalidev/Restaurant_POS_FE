'use client';

import { ChipStripUI } from 'src/components/hook-form/custom-form-elements';

// ----------------------------------------------------------------------

/**
 * Horizontal scrollable category strip for POS.
 * Uses shared ChipStripUI from custom-form-elements; same API and behavior.
 * Min 44px touch targets per spec.
 */
export function PosCategoryStrip({ categories = [], selectedId, onSelect, loading, ...rest }) {
  return (
    <ChipStripUI
      categories={categories}
      selectedId={selectedId}
      onSelect={onSelect}
      loading={loading}
      {...rest}
    />
  );
}
