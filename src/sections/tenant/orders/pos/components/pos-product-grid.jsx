'use client';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';
import { getResolvedImageSrc } from 'src/utils/resolve-image-url';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const MIN_TOUCH_SIZE = 44;

/**
 * Product grid for POS. Tap to add item (once per product); tap again to remove. Multiple different items allowed.
 * Cards show selected (in cart) vs unselected state. Min 44px touch target.
 */
export function PosProductGrid({ items = [], loading, onSelectItem, searchTerm, selectedItemIds = [] }) {
  const [failedImageUrls, setFailedImageUrls] = useState(() => new Set());

  const handleImageError = useCallback((url) => {
    setFailedImageUrls((prev) => new Set(prev).add(url));
  }, []);

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
        const rawImageUrl = item.imageUrl ?? null;
        const imageSrc = getResolvedImageSrc(rawImageUrl);
        const imageFailed = rawImageUrl != null && failedImageUrls.has(rawImageUrl);
        const showImage = imageSrc && !imageFailed;
        const isSelected = Array.isArray(selectedItemIds) && selectedItemIds.includes(item.id);
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
              position: 'relative',
              borderWidth: isSelected ? 2 : 1,
              borderStyle: 'solid',
              borderColor: isSelected ? 'primary.main' : 'divider',
              bgcolor: isSelected ? (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.08) : 'transparent',
              '&:hover': {
                bgcolor: isSelected
                  ? (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.12)
                  : 'action.hover',
              },
              '&:active': {
                bgcolor: isSelected
                  ? (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.16)
                  : 'action.selected',
              },
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
            aria-label={isSelected ? `${name} in cart, tap to remove` : `Add ${name}, ${price}`}
            aria-pressed={isSelected}
          >
            {isSelected && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="solar:check-read-bold" width={14} />
              </Box>
            )}
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
              {showImage ? (
                <Box
                  component="img"
                  src={imageSrc}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                  onError={() => handleImageError(rawImageUrl)}
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
