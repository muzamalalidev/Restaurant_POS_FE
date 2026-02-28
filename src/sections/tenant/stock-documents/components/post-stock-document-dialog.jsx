'use client';

import { useRef , useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { fCurrency } from 'src/utils/format-number';
import { getApiErrorMessage } from 'src/utils/api-error-message';

import { usePostStockDocumentMutation } from 'src/store/api/stock-documents-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { CustomTable } from 'src/components/custom-table';
import { CustomDialog } from 'src/components/custom-dialog';

import {
  getDocumentTypeLabel,
  getDocumentTypeColor,
} from '../utils/stock-document-helpers';

// ----------------------------------------------------------------------

const _formatCurrency = (amount) =>
  amount == null ? '-' : fCurrency(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ----------------------------------------------------------------------

/**
 * Post Stock Document Dialog Component
 *
 * Confirmation dialog before posting. Uses the full row object passed from the list
 * (no getStockDocument API call). Shows document summary, items, and stock impact preview.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object|null} props.record - Full stock document from list
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when posting is successful (receives document id)
 */
export function PostStockDocumentDialog({ open, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [postStockDocument, { isLoading: isPosting }] = usePostStockDocumentMutation();
  const isPostingRef = useRef(false);

  const stockImpactPreview = useMemo(() => {
    if (!record || !record.items || record.items.length === 0) {
      return null;
    }

    const documentType = record.documentType;
    const items = record.items;

    if (documentType === 1) {
      return {
        type: 'increase',
        message: `Will increase stock by the following quantities for each item:`,
        items: items.map((item) => ({
          itemName: item.itemName || '-',
          quantity: item.quantity || 0,
          impact: `+${item.quantity || 0}`,
        })),
      };
    }
    if (documentType === 3) {
      return {
        type: 'decrease',
        message: `Will decrease stock by the following quantities for each item:`,
        items: items.map((item) => ({
          itemName: item.itemName || '-',
          quantity: item.quantity || 0,
          impact: `-${item.quantity || 0}`,
        })),
      };
    }
    if (documentType === 2) {
      return {
        type: 'adjust',
        message: `Will adjust stock by the following quantities for each item (can result in negative stock):`,
        items: items.map((item) => ({
          itemName: item.itemName || '-',
          quantity: item.quantity || 0,
          impact: item.quantity >= 0 ? `+${item.quantity}` : `${item.quantity}`,
        })),
      };
    }

    return null;
  }, [record]);

  const handlePost = async () => {
    if (!record?.id) return;
    if (isPostingRef.current) return;
    isPostingRef.current = true;
    try {
      await postStockDocument(record.id).unwrap();
      if (onSuccess) {
        onSuccess(record.id);
      }
      onClose();
    } catch (error) {
      console.error('Failed to post stock document:', error);
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: 'Failed to post stock document',
      });
      if (isRetryable) {
        toast.error(message, {
          action: {
            label: 'Retry',
            onClick: () => {
              setTimeout(() => handlePost(), 100);
            },
          },
        });
      } else {
        toast.error(message);
      }
    } finally {
      isPostingRef.current = false;
    }
  };

  const hasItems = record?.items && record.items.length > 0;

  // Render actions
  const renderActions = () => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <Field.Button
        variant="outlined"
        color="inherit"
        onClick={onClose}
        disabled={isPosting}
        sx={{ minHeight: 44 }}
      >
        Cancel
      </Field.Button>
      <Field.Button
        variant="contained"
        color="success"
        startIcon="solar:check-circle-bold"
        onClick={handlePost}
        disabled={isPosting || !hasItems}
        loading={isPosting}
        sx={{ minHeight: 44 }}
      >
        Post Document
      </Field.Button>
    </Box>
  );

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Post Stock Document"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      loading={isPosting}
      disableClose={isPosting}
      actions={renderActions()}
    >
      {record ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Warnings */}
          <Stack spacing={2}>
            <Alert severity="warning">
              This action cannot be undone. Posting will create stock transactions and update stock balances permanently.
            </Alert>
            {record.documentType === 1 || record.documentType === 3 ? (
              <Alert severity="info">
                Stock availability will be validated. Insufficient stock will prevent posting.
              </Alert>
            ) : (
              <Alert severity="info">
                Negative stock is allowed for adjustments. The adjustment will be applied regardless of current stock levels.
              </Alert>
            )}
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Document Summary */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Document Summary
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
                  Items Count
                </Typography>
                <Typography variant="body1">{record.items?.length || 0} items</Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Stock Impact Preview */}
          {stockImpactPreview && (
            <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Stock Impact Preview
                </Typography>
                <Alert severity={stockImpactPreview.type === 'adjust' ? 'warning' : 'info'} sx={{ mb: 2 }}>
                  {stockImpactPreview.message}
                </Alert>
                <Card sx={{ mb: 3 }}>
                  <CustomTable
                    rows={stockImpactPreview.items.map((item, index) => ({
                      id: index,
                      itemName: item.itemName,
                      quantity: item.quantity,
                      impact: item.impact,
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
                        field: 'impact',
                        headerName: 'Stock Impact',
                        width: 120,
                        renderCell: (params) => (
                          <Typography
                            variant="body2"
                            align="right"
                            sx={{
                              width: '100%',
                              textAlign: 'right',
                              fontWeight: 600,
                              color: params.value.startsWith('-') ? 'error.main' : 'success.main',
                            }}
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
                </Card>
              </Box>
          )}

          {!hasItems && (
            <Alert severity="error">
              Cannot post a stock document without items. Please add items before posting.
            </Alert>
          )}
        </Box>
      ) : null}
    </CustomDialog>
  );
}

