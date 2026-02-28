'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const MIN_TOUCH_SIZE = 44;

/**
 * Product grid for POS. One tap adds item. Min 44px touch target.
 */
export function PosProductGrid({ items = [], loading, onSelectItem, searchTerm }) {
  if (loading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 2,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} variant="outlined" sx={{ p: 1.5 }}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
            <Skeleton width="80%" height={20} sx={{ mt: 1 }} />
            <Skeleton width="40%" height={20} sx={{ mt: 0.5 }} />
          </Card>
        ))}
      </Box>
    );
  }

  const list = items.filter((item) => item.isActive !== false && item.isAvailable !== false);

  if (list.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {searchTerm ? 'No products match your search.' : 'No products available.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 2,
      }}
    >
      {list.map((item) => {
        const name = item.name || item.id || '';
        const price = Number(item.price) || 0;
        const imageUrl = item.imageUrl || null;
        return (
          <Card
            key={item.id}
            variant="outlined"
            sx={{
              p: 1.5,
              minHeight: 140,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': { bgcolor: 'action.hover' },
              '&:active': { bgcolor: 'action.selected' },
            }}
            onClick={() => onSelectItem && onSelectItem(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectItem && onSelectItem(item);
              }
            }}
            aria-label={`Add ${name}, ${price}`}
          >
            <Box
              sx={{
                width: '100%',
                height: 90,
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: 'background.neutral',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {imageUrl ? (
                <Box
                  component="img"
                  src={imageUrl.startsWith('http') ? imageUrl : `${CONFIG.assetsDir}${imageUrl}`}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              ) : (
                <Iconify icon="solar:cup-star-bold" sx={{ fontSize: 40, color: 'text.disabled' }} />
              )}
            </Box>
            <Typography variant="subtitle2" noWrap sx={{ mt: 1, minHeight: MIN_TOUCH_SIZE - 20 }}>
              {name}
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
              {fCurrency(price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Card>
        );
      })}
    </Box>
  );
}
