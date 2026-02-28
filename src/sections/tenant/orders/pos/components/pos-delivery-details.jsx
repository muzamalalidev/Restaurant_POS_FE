'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

/**
 * Collapsible delivery details section for POS.
 * Shown only when order type is Delivery. Compact layout, touch-friendly.
 */
export function PosDeliveryDetails({ open: sectionVisible, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!sectionVisible) return null;

  return (
    <Box
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        pt: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: expanded ? 1.5 : 0,
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          Delivery details
        </Typography>
        <IconButton
          size="small"
          onClick={() => setExpanded((e) => !e)}
          sx={{ minWidth: 44, minHeight: 44 }}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse delivery details' : 'Expand delivery details'}
        >
          <Iconify icon={expanded ? 'mingcute:up-line' : 'mingcute:down-line'} />
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Field.Text
              name="deliveryDetails.contactName"
              label="Contact name"
              placeholder="Name"
              size="small"
            />
            <Field.Phone
              name="deliveryDetails.phone"
              label="Phone"
              placeholder="Phone number"
              size="small"
            />
          </Box>
          <Field.Text
            name="deliveryDetails.address"
            label="Address"
            placeholder="Street address"
            size="small"
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Field.Text
              name="deliveryDetails.city"
              label="City"
              placeholder="City"
              size="small"
            />
            <Field.Text
              name="deliveryDetails.postalCode"
              label="Postal code"
              placeholder="Postal code"
              size="small"
            />
          </Box>
          <Field.Text
            name="deliveryDetails.landmark"
            label="Landmark"
            placeholder="Landmark (optional)"
            size="small"
          />
          <Field.Text
            name="deliveryDetails.instructions"
            label="Delivery instructions"
            placeholder="Optional instructions for driver"
            multiline
            rows={2}
            size="small"
          />
        </Stack>
      </Collapse>
    </Box>
  );
}
