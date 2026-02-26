'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// ----------------------------------------------------------------------

const MIN_TOUCH_HEIGHT = 44;

/**
 * Horizontal scrollable category strip for POS.
 * Min 44px touch targets per spec.
 */
export function PosCategoryStrip({ categories = [], selectedId, onSelect, loading }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        overflowX: 'auto',
        pb: 1,
        minHeight: MIN_TOUCH_HEIGHT + 8,
        alignItems: 'center',
        '&::-webkit-scrollbar': { height: 6 },
      }}
    >
      <Chip
        label="All Products"
        onClick={() => onSelect(null)}
        variant={selectedId === null ? 'filled' : 'outlined'}
        color="primary"
        sx={{ minHeight: MIN_TOUCH_HEIGHT, flexShrink: 0 }}
      />
      {loading
        ? Array.from({ length: 5 }).map((_, i) => (
            <Chip
              key={i}
              label="..."
              sx={{ minHeight: MIN_TOUCH_HEIGHT, flexShrink: 0, opacity: 0.6 }}
            />
          ))
        : categories.map((cat) => {
            const id = typeof cat === 'object' && cat !== null ? cat.id : cat;
            const label = typeof cat === 'object' && cat !== null ? (cat.name || cat.label || id) : String(cat);
            const isSelected = id === selectedId;
            return (
              <Chip
                key={id}
                label={label}
                onClick={() => onSelect(id)}
                variant={isSelected ? 'filled' : 'outlined'}
                color="primary"
                sx={{ minHeight: MIN_TOUCH_HEIGHT, flexShrink: 0 }}
              />
            );
          })}
    </Box>
  );
}
