'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { CustomTable } from 'src/components/custom-table';
import { CustomDialog } from 'src/components/custom-dialog';

import { getOrderStatusLabel, getOrderStatusColor } from '../utils/order-status';

// ----------------------------------------------------------------------

const formatCurrency = (amount) =>
  amount == null ? '-' : fCurrency(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ----------------------------------------------------------------------

/**
 * Order Details Dialog Component
 *
 * Read-only view of order details. Uses the passed record from the list (no getById).
 * List is requested with includeItems: true so record includes items and full details.
 */
export function OrderDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const orderData = record;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Order Details"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      {orderData ? (
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
                  Branch
                </Typography>
                <Typography variant="body1">{orderData.branchName ?? orderData.branchId ?? '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Order Type
                </Typography>
                <Typography variant="body1">{orderData.orderTypeName ?? orderData.orderTypeId ?? '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Payment Mode
                </Typography>
                <Typography variant="body1">{orderData.paymentMode?.name ?? orderData.paymentModeId ?? '-'}</Typography>
              </Box>
              {(orderData.staffName != null || orderData.staffId) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Staff
                  </Typography>
                  <Typography variant="body1">{orderData.staffName ?? orderData.staffId ?? '-'}</Typography>
                </Box>
              )}
              {(orderData.tableName != null || orderData.tableId) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Table
                  </Typography>
                  <Typography variant="body1">{orderData.tableName ?? orderData.tableId ?? '-'}</Typography>
                </Box>
              )}
              {(orderData.kitchenName != null || orderData.kitchenId) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Kitchen
                  </Typography>
                  <Typography variant="body1">{orderData.kitchenName ?? orderData.kitchenId ?? '-'}</Typography>
                </Box>
              )}
              {(orderData.customerName != null || orderData.customerId) && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">{orderData.customerName ?? orderData.customerId ?? '-'}</Typography>
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
                        renderCell: (params) => (
                          <Typography variant="body2">
                            {params.value}
                          </Typography>
                        ),
                      }] : []),
                    ]}
                    pagination={false}
                    toolbar={false}
                    hideFooter
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
      ) : null}
    </CustomDialog>
  );
}

