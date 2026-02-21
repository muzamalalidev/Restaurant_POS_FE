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

import { useGetStockDocumentQuery } from 'src/store/api/stock-documents-api';
import {
  getDocumentTypeLabel,
  getDocumentTypeColor,
  getStatusLabel,
  getStatusColor,
  canEdit,
  canDelete,
  canPost,
} from '../utils/stock-document-helpers';

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
 * Format date
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

// ----------------------------------------------------------------------

/**
 * Stock Document Details Dialog Component
 * 
 * Read-only view of stock document details with status-based actions.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string|null} props.documentId - Document ID
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onEdit - Callback when Edit button is clicked
 * @param {Function} props.onPost - Callback when Post button is clicked
 * @param {Function} props.onDelete - Callback when Delete button is clicked
 */
export function StockDocumentDetailsDialog({
  open,
  documentId,
  onClose,
  onEdit,
  onPost,
  onDelete,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch document data
  const { data: documentData, isLoading, error: queryError, isError } = useGetStockDocumentQuery(
    documentId,
    { skip: !documentId || !open }
  );

  // Determine if actions should be shown
  const showActions = useMemo(() => {
    if (!documentData) return false;
    return canEdit(documentData.status) || canDelete(documentData.status) || canPost(documentData.status);
  }, [documentData]);

  // Render actions
  const renderActions = () => {
    if (!documentData || !showActions) return null;

    return (
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        {canEdit(documentData.status) && (
          <Field.Button
            variant="outlined"
            color="primary"
            startIcon="solar:pen-bold"
            onClick={() => {
              if (onEdit) {
                onEdit(documentData.id);
              }
            }}
            sx={{ minHeight: 44 }}
          >
            Edit
          </Field.Button>
        )}
        {canPost(documentData.status) && (
          <Field.Button
            variant="contained"
            color="success"
            startIcon="solar:check-circle-bold"
            onClick={() => {
              if (onPost) {
                onPost(documentData.id);
              }
            }}
            sx={{ minHeight: 44 }}
          >
            Post
          </Field.Button>
        )}
        {canDelete(documentData.status) && (
          <Field.Button
            variant="outlined"
            color="error"
            startIcon="solar:trash-bin-trash-bold"
            onClick={() => {
              if (onDelete) {
                onDelete(documentData.id);
              }
            }}
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
      loading={isLoading}
      actions={renderActions()}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Loading document details...
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
            Failed to load document details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {queryError?.data?.message || queryError?.message || 'Document not found or an error occurred.'}
          </Typography>
        </Box>
      ) : documentData ? (
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
                  {documentData.id || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Document Type
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={getDocumentTypeColor(documentData.documentType)} variant="soft">
                    {getDocumentTypeLabel(documentData.documentType)}
                  </Label>
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={getStatusColor(documentData.status)} variant="soft">
                    {getStatusLabel(documentData.status)}
                  </Label>
                </Stack>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Tenant ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {documentData.tenantId || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Branch ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {documentData.branchId || '-'}
                </Typography>
              </Box>
              {documentData.supplierName && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Supplier Name
                  </Typography>
                  <Typography variant="body1">{documentData.supplierName}</Typography>
                </Box>
              )}
              {documentData.remarks && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Remarks
                  </Typography>
                  <Typography variant="body1">{documentData.remarks}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Is Active
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label color={documentData.isActive ? 'success' : 'default'} variant="soft">
                    {documentData.isActive ? 'Active' : 'Inactive'}
                  </Label>
                </Stack>
              </Box>
              {documentData.createdAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">{formatDate(documentData.createdAt)}</Typography>
                </Box>
              )}
              {documentData.updatedAt && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Updated At
                  </Typography>
                  <Typography variant="body1">{formatDate(documentData.updatedAt)}</Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Document Items */}
          {documentData.items && documentData.items.length > 0 && (
            <>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Document Items ({documentData.items.length})
                </Typography>
                <Card>
                  <CustomTable
                    rows={documentData.items.map((item, index) => ({
                      id: index,
                      itemName: item.itemName || '-',
                      quantity: item.quantity || '-',
                      unitPrice: formatCurrency(item.unitPrice),
                      remarks: item.remarks || '-',
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
                        width: 120,
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
                        width: 120,
                        sortable: false,
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
                        sortable: false,
                        renderCell: (params) => (
                          <Typography variant="body2" color="text.secondary">
                            {params.value}
                          </Typography>
                        ),
                      },
                    ]}
                    pagination={{ enabled: false }}
                    sorting={{ enabled: false }}
                    filtering={{ enabled: false }}
                    toolbar={{ show: false }}
                    getRowId={(row) => row.id}
                  />
                </Card>
              </Box>
            </>
          )}

          {(!documentData.items || documentData.items.length === 0) && (
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

