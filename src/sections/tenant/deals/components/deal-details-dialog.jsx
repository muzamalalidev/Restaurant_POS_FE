'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { CustomTable } from 'src/components/custom-table';
import { CustomDialog } from 'src/components/custom-dialog';
import { ImagePreview } from 'src/components/image-preview';

import { getActiveStatusLabel, getActiveStatusColor } from '../utils/deal-helpers';

// ----------------------------------------------------------------------

const formatPrice = (price) =>
  price == null ? '-' : fCurrency(price, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const formatted = fDate(dateStr);
  return formatted === 'Invalid date' ? '-' : formatted;
};

// ----------------------------------------------------------------------

export function DealDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const dealItemsRows = useMemo(() => {
    if (!record?.items || record.items.length === 0) return [];
    return record.items.map((line, index) => ({
      id: line.itemId || `row-${index}`,
      itemName: line.itemName ?? line.itemId ?? '-',
      quantity: line.quantity ?? '-',
      unitPriceFormatted: formatPrice(line.unitPrice),
    }));
  }, [record?.items]);

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Deal Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{record.name || '-'}</Typography>
              </Box>
              {(record.tenantName || record.itemName || record.branchName) && (
                <Stack spacing={1}>
                  {record.tenantName && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Tenant
                      </Typography>
                      <Typography variant="body1">{record.tenantName}</Typography>
                    </Box>
                  )}
                  {record.branchName && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Branch
                      </Typography>
                      <Typography variant="body1">{record.branchName}</Typography>
                    </Box>
                  )}
                  {record.itemName && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Deal Item
                      </Typography>
                      <Typography variant="body1">{record.itemName}</Typography>
                    </Box>
                  )}
                </Stack>
              )}
              {record.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{record.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="body1">{formatPrice(record.price)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body1">{formatDate(record.startDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  End Date
                </Typography>
                <Typography variant="body1">{formatDate(record.endDate)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={getActiveStatusColor(record.isActive)} variant="soft">
                    {getActiveStatusLabel(record.isActive)}
                  </Label>
                </Box>
              </Box>
            </Stack>
          </Box>

          {record.imageUrl && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Image
                </Typography>
                <Box
                  sx={{
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: (t) => `1px solid ${t.palette.divider}`,
                  }}
                >
                  <ImagePreview
                    imageUrl={record.imageUrl}
                    alt={record.name || 'Deal image'}
                    width="100%"
                    ratio="16/9"
                    sx={{ maxHeight: 300 }}
                  />
                </Box>
              </Box>
            </>
          )}

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Deal Items
            </Typography>
            {record.items && record.items.length > 0 ? (
              <CustomTable
                rows={dealItemsRows}
                columns={[
                  {
                    field: 'itemName',
                    headerName: 'Item',
                    flex: 1,
                    renderCell: (params) => (
                      <Typography variant="body2">{params.value}</Typography>
                    ),
                  },
                  {
                    field: 'quantity',
                    headerName: 'Quantity',
                    width: 120,
                    renderCell: (params) => (
                      <Typography
                        variant="body2"
                        sx={{ width: '100%', textAlign: 'right' }}
                      >
                        {params.value}
                      </Typography>
                    ),
                  },
                  {
                    field: 'unitPriceFormatted',
                    headerName: 'Unit Price',
                    width: 120,
                    renderCell: (params) => (
                      <Typography
                        variant="body2"
                        sx={{ width: '100%', textAlign: 'right' }}
                      >
                        {params.value}
                      </Typography>
                    ),
                  },
                ]}
                pagination={false}
                toolbar={false}
                hideFooter
                getRowId={(row) => row.id}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No items
              </Typography>
            )}
          </Box>
        </Box>
      ) : null}
    </CustomDialog>
  );
}
