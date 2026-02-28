'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { fDateTime } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Field } from 'src/components/hook-form';
import { CustomTable } from 'src/components/custom-table';
import { CustomDialog } from 'src/components/custom-dialog';

import {
  canEdit,
  canPost,
  canDelete,
  getStatusLabel,
  getStatusColor,
  getDocumentTypeLabel,
  getDocumentTypeColor,
} from '../utils/stock-document-helpers';

// ----------------------------------------------------------------------

const formatCurrency = (amount) =>
  amount == null ? '-' : fCurrency(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const formatted = fDateTime(dateString);
  return formatted === 'Invalid date' ? '-' : formatted;
};

// ----------------------------------------------------------------------

/**
 * Stock Document Details Dialog Component
 *
 * Read-only view of stock document details. Uses the full row object passed from the list
 * (no getStockDocument API call). Status-based actions pass record to callbacks.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object|null} props.record - Full stock document from list
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onEdit - Callback when Edit is clicked (receives record)
 * @param {Function} props.onPost - Callback when Post is clicked (receives record)
 * @param {Function} props.onDelete - Callback when Delete is clicked (receives record)
 */
export function StockDocumentDetailsDialog({
  open,
  record,
  onClose,
  onEdit,
  onPost,
  onDelete,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const showActions = useMemo(() => {
    if (!record) return false;
    return canEdit(record.status) || canDelete(record.status) || canPost(record.status);
  }, [record]);

  const renderActions = () => {
    if (!record || !showActions) return null;

    return (
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        {canEdit(record.status) && (
          <Field.Button
            variant="outlined"
            color="primary"
            startIcon="solar:pen-bold"
            onClick={() => onEdit?.(record)}
            sx={{ minHeight: 44 }}
          >
            Edit
          </Field.Button>
        )}
        {canPost(record.status) && (
          <Field.Button
            variant="contained"
            color="success"
            startIcon="solar:check-circle-bold"
            onClick={() => onPost?.(record)}
            sx={{ minHeight: 44 }}
          >
            Post
          </Field.Button>
        )}
        {canDelete(record.status) && (
          <Field.Button
            variant="outlined"
            color="error"
            startIcon="solar:trash-bin-trash-bold"
            onClick={() => onDelete?.(record)}
            sx={{ minHeight: 44 }}
          >
            Delete
          </Field.Button>
        )}
      </Box>
    );
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Stock Document Details"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      actions={renderActions()}
    >
      {record ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Document Header */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Document Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Document ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {record.id || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Document Type
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={getDocumentTypeColor(record.documentType)} variant="soft">
                    {getDocumentTypeLabel(record.documentType)}
                  </Label>
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={getStatusColor(record.status)} variant="soft">
                    {getStatusLabel(record.status)}
                  </Label>
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tenant ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {record.tenantId || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Branch ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {record.branchId || '-'}
                </Typography>
              </Box>
              {record.supplierName && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Supplier Name
                  </Typography>
                  <Typography variant="body1">{record.supplierName}</Typography>
                </Box>
              )}
              {record.remarks && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Remarks
                  </Typography>
                  <Typography variant="body1">{record.remarks}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Is Active
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={record.isActive ? 'success' : 'default'} variant="soft">
                    {record.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </Stack>
              </Box>
              {record.createDate && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">{formatDate(record.createDate)}</Typography>
                </Box>
              )}
              {record.updatedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Updated At
                  </Typography>
                  <Typography variant="body1">{formatDate(record.updatedAt)}</Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Document Items */}
          {record.items && record.items.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Document Items ({record.items.length})
              </Typography>
              <Card sx={{ mb: 3 }}>
                <CustomTable
                  rows={record.items.map((item, index) => ({
                    id: index,
                    itemName: item.itemName || '-',
                    quantity: item.quantity ?? '-',
                    unitPrice: formatCurrency(item.unitPrice),
                    remarks: item.remarks || '-',
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
                      width: 120,
                      renderCell: (params) => (
                        <Typography variant="body2" align="right" sx={{ width: '100%', textAlign: 'right' }}>
                          {params.value}
                        </Typography>
                      ),
                    },
                    {
                      field: 'unitPrice',
                      headerName: 'Unit Price',
                      width: 120,
                      renderCell: (params) => (
                        <Typography variant="body2" align="right" sx={{ width: '100%', textAlign: 'right' }}>
                          {params.value}
                        </Typography>
                      ),
                    },
                    {
                      field: 'remarks',
                      headerName: 'Remarks',
                      flex: 1,
                      renderCell: (params) => (
                        <Typography variant="body2" color="text.secondary">
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
              </Card>
            </Box>
          )}

          {(!record.items || record.items.length === 0) && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No items in this document.
              </Typography>
            </Box>
          )}
        </Box>
      ) : null}
    </CustomDialog>
  );
}
