'use client';

import { useMediaQuery, useTheme } from '@mui/material';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';

import { CustomDialog } from 'src/components/custom-dialog';
import { CustomTable } from 'src/components/custom-table';
import { Field } from 'src/components/hook-form';
import { Label } from 'src/components/label';

import { useGetOrderByIdQuery } from 'src/store/api/orders-api';
import { getOrderStatusLabel, getOrderStatusColor } from '../utils/order-status';

// ----------------------------------------------------------------------

/**
 * Format amount as currency
 */
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ----------------------------------------------------------------------

/**
 * Order Details Dialog Component
 * 
 * Read-only view of order details.
 * No action buttons - purely informational.
 * 
 * Uses GetById endpoint (fully implemented).
 */
export function OrderDetailsDialog({ open, orderId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch order data (P1-006: refetch for Retry on error)
  const { data: orderData, isLoading, error: queryError, isError, refetch } = useGetOrderByIdQuery(
    { id: orderId, includeItems: true },
    { skip: !orderId || !open }
  );

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Order Details"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      loading={isLoading}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Loading order details...
          </Typography>
        </Box>
      ) : isError ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
            gap: 2,
          }}
        >
          <Typography variant="body1" color="error">
            Failed to load order details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {queryError?.data?.message || queryError?.message || 'Order not found or an error occurred.'}
          </Typography>
          <Field.Button variant="contained" onClick={() => refetch()} startIcon="solar:refresh-bold" sx={{ mt: 1 }}>
            Retry
          </Field.Button>
        </Box>
      ) : orderData ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Order ID
                </Typography>
                <Typography variant="body1">{orderData.id || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={getOrderStatusColor(orderData.status)} variant="soft">
                    {getOrderStatusLabel(orderData.status)}
                  </Label>
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Branch ID
                </Typography>
                <Typography variant="body1">{orderData.branchId || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Order Type ID
                </Typography>
                <Typography variant="body1">{orderData.orderTypeId || '-'}</Typography>
              </Box>
              {orderData.paymentMode && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Payment Mode
                  </Typography>
                  <Typography variant="body1">{orderData.paymentMode.name || '-'}</Typography>
                </Box>
              )}
              {orderData.staffId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Staff ID
                  </Typography>
                  <Typography variant="body1">{orderData.staffId || '-'}</Typography>
                </Box>
              )}
              {orderData.tableId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Table ID
                  </Typography>
                  <Typography variant="body1">{orderData.tableId || '-'}</Typography>
                </Box>
              )}
              {orderData.kitchenId && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Kitchen ID
                  </Typography>
                  <Typography variant="body1">{orderData.kitchenId || '-'}</Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Order Items */}
          {orderData.items && orderData.items.length > 0 && (
            <>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Order Items
                </Typography>
                <Card>
                  <CustomTable
                    rows={orderData.items.map((item, index) => ({
                      id: index,
                      itemName: item.itemName || '-',
                      quantity: item.quantity || '-',
                      unitPrice: formatCurrency(item.unitPrice),
                      subTotal: formatCurrency(item.subTotal),
                      notes: item.notes || '-',
                    }))}
                    columns={[
                      {
                        field: 'itemName',
                        headerName: 'Item Name',
                        flex: 1,
                        sortable: false,
                        renderCell: (params) => (
                          <Typography variant="body2">
                            {params.value}
                          </Typography>
                        ),
                      },
                      {
                        field: 'quantity',
                        headerName: 'Quantity',
                        flex: 1,
                        sortable: false,
                        renderCell: (params) => (
                          <Typography variant="body2" align="right" sx={{ width: '100%', textAlign: 'right' }}>
                            {params.value}
                          </Typography>
                        ),
                      },
                      {
                        field: 'unitPrice',
                        headerName: 'Unit Price',
                        flex: 1,
                        sortable: false,
                        renderCell: (params) => (
                          <Typography variant="body2" align="right" sx={{ width: '100%', textAlign: 'right' }}>
                            {params.value}
                          </Typography>
                        ),
                      },
                      {
                        field: 'subTotal',
                        headerName: 'Subtotal',
                        flex: 1,
                        sortable: false,
                        renderCell: (params) => (
                          <Typography variant="body2" align="right" sx={{ width: '100%', textAlign: 'right', fontWeight: 600 }}>
                            {params.value}
                          </Typography>
                        ),
                      },
                      ...(orderData.items.some((item) => item.notes) ? [{
                        field: 'notes',
                        headerName: 'Notes',
                        flex: 1,
                        sortable: false,
                        renderCell: (params) => (
                          <Typography variant="body2">
                            {params.value}
                          </Typography>
                        ),
                      }] : []),
                    ]}
                    pagination={{ enabled: false }}
                    sorting={{ enabled: false }}
                    filtering={{ enabled: false }}
                    toolbar={{ show: false }}
                    getRowId={(row) => row.id}
                  />
                </Card>
              </Box>
              <Divider sx={{ borderStyle: 'dashed' }} />
            </>
          )}

          {/* Delivery Details */}
          {orderData.deliveryDetails && (
            <>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Delivery Details
                </Typography>
                <Stack spacing={2}>
                  {orderData.deliveryDetails.contactName && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Contact Name
                      </Typography>
                      <Typography variant="body1">{orderData.deliveryDetails.contactName}</Typography>
                    </Box>
                  )}
                  {orderData.deliveryDetails.phone && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{orderData.deliveryDetails.phone}</Typography>
                    </Box>
                  )}
                  {orderData.deliveryDetails.address && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">{orderData.deliveryDetails.address}</Typography>
                    </Box>
                  )}
                  {orderData.deliveryDetails.city && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        City
                      </Typography>
                      <Typography variant="body1">{orderData.deliveryDetails.city}</Typography>
                    </Box>
                  )}
                  {orderData.deliveryDetails.postalCode && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Postal Code
                      </Typography>
                      <Typography variant="body1">{orderData.deliveryDetails.postalCode}</Typography>
                    </Box>
                  )}
                  {orderData.deliveryDetails.landmark && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Landmark
                      </Typography>
                      <Typography variant="body1">{orderData.deliveryDetails.landmark}</Typography>
                    </Box>
                  )}
                  {orderData.deliveryDetails.instructions && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Instructions
                      </Typography>
                      <Typography variant="body1">{orderData.deliveryDetails.instructions}</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
              <Divider sx={{ borderStyle: 'dashed' }} />
            </>
          )}

          {/* Pricing Summary */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Pricing Summary
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {formatCurrency(orderData.subTotal)}
                </Typography>
              </Box>
              {orderData.taxAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tax {orderData.taxPercentage ? `(${orderData.taxPercentage}%)` : ''}:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(orderData.taxAmount)}
                  </Typography>
                </Box>
              )}
              {orderData.discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Discount {orderData.discountPercentage ? `(${orderData.discountPercentage}%)` : ''}:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                    -{formatCurrency(orderData.discountAmount)}
                  </Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Total Amount:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(orderData.totalAmount)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Notes */}
          {orderData.notes && (
            <>
              <Divider sx={{ borderStyle: 'dashed' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Notes
                </Typography>
                <Typography variant="body1">{orderData.notes}</Typography>
              </Box>
            </>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Order not found
          </Typography>
        </Box>
      )}
    </CustomDialog>
  );
}

