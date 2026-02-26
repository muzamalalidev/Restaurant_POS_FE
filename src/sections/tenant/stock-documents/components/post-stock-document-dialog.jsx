'use client';

import { useRef , useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetStockDocumentQuery, usePostStockDocumentMutation } from 'src/store/api/stock-documents-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { CustomTable } from 'src/components/custom-table';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

import {
  getDocumentTypeLabel,
  getDocumentTypeColor,
} from '../utils/stock-document-helpers';

// ----------------------------------------------------------------------

/**
 * Format amount as currency
 */
const _formatCurrency = (amount) => {
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
 * Post Stock Document Dialog Component
 * 
 * Confirmation dialog before posting a stock document.
 * Shows document summary, items, stock impact preview, and warnings.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string|null} props.documentId - Document ID
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when posting is successful
 */
export function PostStockDocumentDialog({ open, documentId, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch document data
  const { data: documentData, isLoading, error: queryError, isError, refetch } = useGetStockDocumentQuery(documentId, {
    skip: !documentId || !open,
  });

  // Post mutation
  const [postStockDocument, { isLoading: isPosting }] = usePostStockDocumentMutation();
  // P0-002: Ref guard to prevent double-submit on Post
  const isPostingRef = useRef(false);

  // Calculate stock impact preview
  const stockImpactPreview = useMemo(() => {
    if (!documentData || !documentData.items || documentData.items.length === 0) {
      return null;
    }

    const documentType = documentData.documentType;
    const items = documentData.items;

    if (documentType === 1) {
      // Purchase - increases stock
      return {
        type: 'increase',
        message: `Will increase stock by the following quantities for each item:`,
        items: items.map((item) => ({
          itemName: item.itemName || '-',
          quantity: item.quantity || 0,
          impact: `+${item.quantity || 0}`,
        })),
      };
    } else if (documentType === 3) {
      // Wastage - decreases stock
      return {
        type: 'decrease',
        message: `Will decrease stock by the following quantities for each item:`,
        items: items.map((item) => ({
          itemName: item.itemName || '-',
          quantity: item.quantity || 0,
          impact: `-${item.quantity || 0}`,
        })),
      };
    } else if (documentType === 2) {
      // Adjustment - can increase or decrease
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
  }, [documentData]);

  // Handle post (P0-002: ref guard; P1-002: show error toast on failure)
  const handlePost = async () => {
    if (!documentId) return;
    if (isPostingRef.current) return;
    isPostingRef.current = true;
    try {
      await postStockDocument(documentId).unwrap();
      if (onSuccess) {
        onSuccess(documentId);
      }
      onClose();
    } catch (error) {
      console.error('Failed to post stock document:', error);
      const errorMessage = error?.data?.message || error?.data || error?.message || 'Failed to post stock document';
      toast.error(errorMessage);
    } finally {
      isPostingRef.current = false;
    }
  };

  // Check if document has items
  const hasItems = documentData?.items && documentData.items.length > 0;

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
      loading={isLoading || isPosting}
      disableClose={isPosting}
      actions={renderActions()}
    >
      <QueryStateContent
        isLoading={isLoading}
        isError={isError}
        error={queryError}
        onRetry={refetch}
        loadingMessage="Loading document information..."
        errorTitle="Failed to load document"
        errorMessageOptions={{
          defaultMessage: 'Failed to load document',
          notFoundMessage: 'Document not found',
        }}
        isEmpty={!documentData && !isLoading && !isError}
        emptyMessage="Document not found"
      >
        {documentData ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Warnings */}
          <Stack spacing={2}>
            <Alert severity="warning">
              This action cannot be undone. Posting will create stock transactions and update stock balances permanently.
            </Alert>
            {documentData.documentType === 1 || documentData.documentType === 3 ? (
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
                  Items Count
                </Typography>
                <Typography variant="body1">{documentData.items?.length || 0} items</Typography>
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
                <Card>
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
                        field: 'impact',
                        headerName: 'Stock Impact',
                        width: 120,
                        sortable: false,
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
                    pagination={{ enabled: false }}
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
      </QueryStateContent>
    </CustomDialog>
  );
}

