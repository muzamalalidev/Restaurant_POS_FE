'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetTenantsDropdownQuery } from 'src/store/api/tenants-api';
import { useGetBranchesDropdownQuery } from 'src/store/api/branches-api';
import {
  useGetAllStockDocumentsQuery,
  useDeleteStockDocumentMutation,
  useToggleStockDocumentActiveMutation,
} from 'src/store/api/stock-documents-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { StockDocumentFormDialog } from '../form/stock-document-form-dialog';
import { PostStockDocumentDialog } from '../components/post-stock-document-dialog';
import { StockDocumentDetailsDialog } from '../components/stock-document-details-dialog';
import {
  canEdit,
  canPost,
  canDelete,
  getStatusLabel,
  getStatusColor,
  STATUS_OPTIONS,
  getDocumentTypeLabel,
  getDocumentTypeColor,
  DOCUMENT_TYPE_OPTIONS,
} from '../utils/stock-document-helpers';

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

/**
 * Truncate document ID for display
 */
const truncateId = (id) => {
  if (!id) return '-';
  if (id.length <= 8) return id;
  return `${id.substring(0, 8)}...`;
};

// ----------------------------------------------------------------------

/**
 * Stock Documents List View Component
 * 
 * Displays all stock documents in a data-dense, filterable grid with actions.
 * Manages dialog state for create/edit/view/post/delete operations.
 * 
 * Required filters: tenantId and branchId (both required for GetAllStockDocuments).
 * P1-004: Tenant/branch context and data isolation are enforced at the backend API level.
 * P2-003: Role-based visibility for Create/Edit/Post/Delete can be applied when backend supports it.
 */
export function StockDocumentsListView() {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogDocumentId, setFormDialogDocumentId] = useState(null);
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogDocumentId, setDetailsDialogDocumentId] = useState(null);
  
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postDialogDocumentId, setPostDialogDocumentId] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState(null);
  const [deleteDocumentIdDisplay, setDeleteDocumentIdDisplay] = useState(null);

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  // Search state (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filter state (required: tenantId and branchId)
  const [tenantId, setTenantId] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [status, setStatus] = useState(null);
  const [documentType, setDocumentType] = useState(null);

  // Minimal form for search
  const searchForm = useForm({
    defaultValues: {
      searchTerm: '',
    },
  });

  // Minimal forms for filters
  const tenantFilterForm = useForm({
    defaultValues: {
      tenantId: null,
    },
  });

  const branchFilterForm = useForm({
    defaultValues: {
      branchId: null,
    },
  });

  const statusFilterForm = useForm({
    defaultValues: {
      status: null,
    },
  });

  const documentTypeFilterForm = useForm({
    defaultValues: {
      documentType: null,
    },
  });

  // Watch search form value changes
  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  // Helper function to extract ID from object or string
  const getId = useCallback((value) => {
    if (!value) return null;
    if (typeof value === 'object' && value !== null && 'id' in value) {
      return value.id;
    }
    return value;
  }, []);

  // Sync tenant filter form with state
  const isSyncingTenantRef = useRef(false);
  useEffect(() => {
    if (isSyncingTenantRef.current) return;
    const currentFormValue = tenantFilterForm.getValues('tenantId');
    const stateId = getId(tenantId);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      tenantFilterForm.setValue('tenantId', tenantId, { shouldValidate: false, shouldDirty: false });
    }
  }, [tenantId, tenantFilterForm, getId]);

  // Watch tenant filter form value changes
  const watchedTenantId = tenantFilterForm.watch('tenantId');
  useEffect(() => {
    const watchedId = getId(watchedTenantId);
    const currentId = getId(tenantId);
    
    if (watchedId !== currentId) {
      isSyncingTenantRef.current = true;
      setTenantId(watchedTenantId);
      // When tenantId changes, clear branchId (branch must belong to tenant)
      if (watchedTenantId) {
        setBranchId(null);
        branchFilterForm.setValue('branchId', null, { shouldValidate: false, shouldDirty: false });
      }
      setPageNumber(1);
      setTimeout(() => {
        isSyncingTenantRef.current = false;
      }, 0);
    }
  }, [watchedTenantId, tenantId, branchFilterForm, getId]);

  // Sync branch filter form with state
  const isSyncingBranchRef = useRef(false);
  useEffect(() => {
    if (isSyncingBranchRef.current) return;
    const currentFormValue = branchFilterForm.getValues('branchId');
    const stateId = getId(branchId);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      branchFilterForm.setValue('branchId', branchId, { shouldValidate: false, shouldDirty: false });
    }
  }, [branchId, branchFilterForm, getId]);

  // Watch branch filter form value changes
  const watchedBranchId = branchFilterForm.watch('branchId');
  useEffect(() => {
    const watchedId = getId(watchedBranchId);
    const currentId = getId(branchId);
    
    if (watchedId !== currentId) {
      isSyncingBranchRef.current = true;
      setBranchId(watchedBranchId);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingBranchRef.current = false;
      }, 0);
    }
  }, [watchedBranchId, branchId, getId]);

  // Sync status filter form with state
  const isSyncingStatusRef = useRef(false);
  useEffect(() => {
    if (isSyncingStatusRef.current) return;
    const currentFormValue = statusFilterForm.getValues('status');
    const stateId = getId(status);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      statusFilterForm.setValue('status', status, { shouldValidate: false, shouldDirty: false });
    }
  }, [status, statusFilterForm, getId]);

  // Watch status filter form value changes
  const watchedStatus = statusFilterForm.watch('status');
  useEffect(() => {
    const watchedId = getId(watchedStatus);
    const currentId = getId(status);
    
    if (watchedId !== currentId) {
      isSyncingStatusRef.current = true;
      setStatus(watchedStatus);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingStatusRef.current = false;
      }, 0);
    }
  }, [watchedStatus, status, getId]);

  // Sync documentType filter form with state
  const isSyncingDocumentTypeRef = useRef(false);
  useEffect(() => {
    if (isSyncingDocumentTypeRef.current) return;
    const currentFormValue = documentTypeFilterForm.getValues('documentType');
    const stateId = getId(documentType);
    const formId = getId(currentFormValue);
    
    if (stateId !== formId) {
      documentTypeFilterForm.setValue('documentType', documentType, { shouldValidate: false, shouldDirty: false });
    }
  }, [documentType, documentTypeFilterForm, getId]);

  // Watch documentType filter form value changes
  const watchedDocumentType = documentTypeFilterForm.watch('documentType');
  useEffect(() => {
    const watchedId = getId(watchedDocumentType);
    const currentId = getId(documentType);
    
    if (watchedId !== currentId) {
      isSyncingDocumentTypeRef.current = true;
      setDocumentType(watchedDocumentType);
      setPageNumber(1);
      setTimeout(() => {
        isSyncingDocumentTypeRef.current = false;
      }, 0);
    }
  }, [watchedDocumentType, documentType, getId]);

  const { data: tenantsDropdown } = useGetTenantsDropdownQuery();
  const tenantOptions = useMemo(() => {
    if (!tenantsDropdown || !Array.isArray(tenantsDropdown)) return [];
    return tenantsDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [tenantsDropdown]);

  const { data: branchesDropdown } = useGetBranchesDropdownQuery({
    tenantId: getId(tenantId) || undefined,
  });
  const branchOptions = useMemo(() => {
    if (!branchesDropdown || !Array.isArray(branchesDropdown)) return [];
    return branchesDropdown.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchesDropdown]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch stock documents with pagination, search, and filter params
  const queryParams = useMemo(
    () => {
      const tenantIdValue = getId(tenantId);
      const branchIdValue = getId(branchId);
      const statusValue = getId(status);
      const documentTypeValue = getId(documentType);

      // Both tenantId and branchId are required
      if (!tenantIdValue || !branchIdValue) {
        return null; // Don't fetch if required filters are missing
      }

      return {
        tenantId: tenantIdValue,
        branchId: branchIdValue,
        status: statusValue || undefined,
        documentType: documentTypeValue || undefined,
        pageNumber,
        pageSize,
        searchTerm: debouncedSearchTerm.trim() || undefined,
      };
    },
    [pageNumber, pageSize, debouncedSearchTerm, tenantId, branchId, status, documentType, getId]
  );

  const { data: documentsResponse, isLoading, error, refetch } = useGetAllStockDocumentsQuery(queryParams, {
    skip: !queryParams, // Skip query if required filters are missing
  });

  // Extract data from paginated response
  const documents = useMemo(() => {
    if (!documentsResponse) return [];
    return documentsResponse.data || [];
  }, [documentsResponse]);

  // Extract pagination metadata
  const paginationMeta = useMemo(() => {
    if (!documentsResponse) {
      return {
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      };
    }
    return {
      totalCount: documentsResponse.totalCount || 0,
      totalPages: documentsResponse.totalPages || 0,
      hasPreviousPage: documentsResponse.hasPreviousPage || false,
      hasNextPage: documentsResponse.hasNextPage || false,
    };
  }, [documentsResponse]);

  // Mutations
  const [deleteStockDocument] = useDeleteStockDocumentMutation();
  const [toggleStockDocumentActive, { isLoading: isTogglingActive }] = useToggleStockDocumentActiveMutation();

  // Track which document is being toggled
  const [togglingDocumentId, setTogglingDocumentId] = useState(null);
  // P0-004: Ref guard to prevent rapid toggle clicks (in-flight ids)
  const togglingIdsRef = useRef(new Set());

  // Handle create
  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogDocumentId(null);
    setFormDialogOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((documentId) => {
    setFormDialogMode('edit');
    setFormDialogDocumentId(documentId);
    setFormDialogOpen(true);
  }, []);

  // Handle view details
  const handleViewDetails = useCallback((documentId) => {
    setDetailsDialogDocumentId(documentId);
    setDetailsDialogOpen(true);
  }, []);

  // Handle post
  const handlePost = useCallback((documentId) => {
    setPostDialogDocumentId(documentId);
    setPostDialogOpen(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback((documentId) => {
    setDeleteDocumentId(documentId);
    setDeleteDocumentIdDisplay(truncateId(documentId));
    setDeleteConfirmOpen(true);
  }, []);

  // Handle toggle active (P0-004: ref guard prevents rapid clicks)
  const handleToggleActive = useCallback(
    async (documentId, currentIsActive) => {
      if (togglingIdsRef.current.has(documentId)) return;
      togglingIdsRef.current.add(documentId);
      setTogglingDocumentId(documentId);
      try {
        await toggleStockDocumentActive(documentId).unwrap();
        toast.success(`Document ${currentIsActive ? 'deactivated' : 'activated'} successfully`);
      } catch (err) {
        console.error('Failed to toggle document active status:', err);
        const { message } = getApiErrorMessage(err, {
          defaultMessage: 'Failed to toggle document active status',
        });
        toast.error(message);
      } finally {
        togglingIdsRef.current.delete(documentId);
        setTogglingDocumentId(null);
      }
    },
    [toggleStockDocumentActive]
  );

  // Handle form dialog success
  const handleFormDialogSuccess = useCallback(
    (result, action) => {
      if (action === 'created') {
        toast.success('Stock document created successfully');
      } else if (action === 'updated') {
        toast.success('Stock document updated successfully');
      }
      refetch();
    },
    [refetch]
  );

  // Handle details dialog actions
  const handleDetailsDialogEdit = useCallback(
    (documentId) => {
      setDetailsDialogOpen(false);
      handleEdit(documentId);
    },
    [handleEdit]
  );

  const handleDetailsDialogPost = useCallback(
    (documentId) => {
      setDetailsDialogOpen(false);
      handlePost(documentId);
    },
    [handlePost]
  );

  const handleDetailsDialogDelete = useCallback(
    (documentId) => {
      setDetailsDialogOpen(false);
      handleDelete(documentId);
    },
    [handleDelete]
  );

  // Handle post dialog success
  const handlePostDialogSuccess = useCallback(
    (documentId) => {
      toast.success('Stock document posted successfully');
      refetch();
    },
    [refetch]
  );

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDocumentId) return;

    try {
      await deleteStockDocument(deleteDocumentId).unwrap();
      toast.success('Stock document deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteDocumentId(null);
      setDeleteDocumentIdDisplay(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete stock document:', err);
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete stock document',
      });
      toast.error(message);
    }
  }, [deleteDocumentId, deleteStockDocument, refetch]);

  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
    setDeleteDocumentId(null);
    setDeleteDocumentIdDisplay(null);
  }, []);

  // Table columns
  const columns = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'Document ID',
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {truncateId(params.value)}
          </Typography>
        ),
      },
      {
        field: 'tenantName',
        headerName: 'Tenant Name',
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2">{params.value || '-'}</Typography>
        ),
      },
      {
        field: 'branchName',
        headerName: 'Branch Name',
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2">{params.value || '-'}</Typography>
        ),
      },
      {
        field: 'documentType',
        headerName: 'Document Type',
        width: 130,
        sortable: false,
        renderCell: (params) => (
          <Label color={getDocumentTypeColor(params.value)} variant="soft">
            {getDocumentTypeLabel(params.value)}
          </Label>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 100,
        sortable: false,
        renderCell: (params) => (
          <Label color={getStatusColor(params.value)} variant="soft">
            {getStatusLabel(params.value)}
          </Label>
        ),
      },
      {
        field: 'supplierName',
        headerName: 'Supplier Name',
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {params.value || '-'}
          </Typography>
        ),
      },
      {
        field: 'itemsCount',
        headerName: 'Items Count',
        width: 100,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2" align="right" sx={{ width: '100%', textAlign: 'right' }}>
            {params.value || 0}
          </Typography>
        ),
      },
      {
        field: 'createdAt',
        headerName: 'Created Date',
        width: 160,
        sortable: false,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary">
            {formatDate(params.value)}
          </Typography>
        ),
      },
      {
        field: 'isActive',
        headerName: 'Active',
        width: 80,
        sortable: false,
        renderCell: (params) => (
          <Switch
            checked={params.value}
            onChange={(e) => {
              e.stopPropagation();
              handleToggleActive(params.row.id, params.value);
            }}
            disabled={isTogglingActive && togglingDocumentId === params.row.id}
            size="small"
          />
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 180,
        sortable: false,
        renderCell: (params) => {
          const document = params.row;
          const canEditDocument = canEdit(document.status);
          const canDeleteDocument = canDelete(document.status);
          const canPostDocument = canPost(document.status);

          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(document.id);
                  }}
                  sx={{ minHeight: 36, minWidth: 36 }}
                >
                  <Iconify icon="solar:eye-bold" />
                </IconButton>
              </Tooltip>
              {canEditDocument && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    color="info"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(document.id);
                    }}
                    sx={{ minHeight: 36, minWidth: 36 }}
                  >
                    <Iconify icon="solar:pen-bold" />
                  </IconButton>
                </Tooltip>
              )}
              {canPostDocument && (
                <Tooltip title="Post">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePost(document.id);
                    }}
                    sx={{ minHeight: 36, minWidth: 36 }}
                  >
                    <Iconify icon="solar:check-circle-bold" />
                  </IconButton>
                </Tooltip>
              )}
              {canDeleteDocument && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(document.id);
                    }}
                    sx={{ minHeight: 36, minWidth: 36 }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        },
      },
    ],
    [handleViewDetails, handleEdit, handlePost, handleDelete, handleToggleActive, isTogglingActive, togglingDocumentId]
  );

  // Table rows
  const rows = useMemo(
    () =>
      documents.map((document) => ({
        id: document.id,
        tenantName: document.tenantName || '-',
        branchName: document.branchName || '-',
        documentType: document.documentType,
        status: document.status,
        supplierName: document.supplierName || '-',
        itemsCount: document.items?.length || 0,
        createdAt: document.createdAt,
        isActive: document.isActive ?? true,
      })),
    [documents]
  );

  // Check if required filters are set
  const hasRequiredFilters = getId(tenantId) && getId(branchId);

  return (
    <>
      <Box>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h4">Stock Documents</Typography>
            <Field.Button
              variant="contained"
              startIcon="mingcute:add-line"
              onClick={handleCreate}
              sx={{ minHeight: 44 }}
            >
              Create Document
            </Field.Button>
          </Stack>

          {/* Filters */}
          <Card sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {/* Tenant Filter (Required) */}
                <FormProvider {...tenantFilterForm}>
                  <Field.Autocomplete
                    name="tenantId"
                    label="Tenant"
                    options={tenantOptions}
                    required
                    sx={{ flex: 1 }}
                  />
                </FormProvider>

                {/* Branch Filter (Required, filtered by tenant) */}
                <FormProvider {...branchFilterForm}>
                  <Field.Autocomplete
                    name="branchId"
                    label="Branch"
                    options={branchOptions}
                    required
                    disabled={!getId(tenantId)}
                    slotProps={{
                      textField: {
                        helperText: !getId(tenantId) ? 'Please select a tenant first' : undefined,
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                </FormProvider>

                {/* Status Filter (Optional) */}
                <FormProvider {...statusFilterForm}>
                  <Field.Autocomplete
                    name="status"
                    label="Status"
                    options={STATUS_OPTIONS}
                    sx={{ flex: 1 }}
                  />
                </FormProvider>

                {/* Document Type Filter (Optional) */}
                <FormProvider {...documentTypeFilterForm}>
                  <Field.Autocomplete
                    name="documentType"
                    label="Document Type"
                    options={DOCUMENT_TYPE_OPTIONS}
                    sx={{ flex: 1 }}
                  />
                </FormProvider>
              </Stack>

              {/* Search */}
              <FormProvider {...searchForm}>
                <Field.Text
                  name="searchTerm"
                  placeholder="Search by Supplier Name, Remarks, or Document ID..."
                  slotProps={{
                    textField: {
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      },
                    },
                  }}
                />
              </FormProvider>
            </Stack>
          </Card>

          {/* Table */}
          {!hasRequiredFilters ? (
            <Card sx={{ p: 6 }}>
              <EmptyContent
                title="Select Filters"
                description="Please select both Tenant and Branch to view stock documents."
              />
            </Card>
          ) : isLoading ? (
            <Card sx={{ p: 6 }}>
              <EmptyContent
                title="Loading..."
                description="Loading stock documents..."
              />
            </Card>
          ) : (
            <CustomTable
              rows={rows}
              columns={columns}
              loading={isLoading}
              error={error}
              onRetry={refetch}
              errorEntityLabel="stock documents"
              pagination={{
                ...DEFAULT_PAGINATION,
                mode: 'server',
                pageSize,
                rowCount: paginationMeta.totalCount,
                onPageChange: (newPage) => setPageNumber(newPage + 1),
                onPageSizeChange: (newPageSize) => {
                  setPageSize(newPageSize);
                  setPageNumber(1);
                },
              }}
              getRowId={(row) => row.id}
              emptyContent={
                <EmptyContent
                  title="No stock documents found"
                  description={
                    searchTerm || tenantId || branchId || status || documentType
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by creating a new stock document"
                  }
                />
              }
            />
          )}
        </Stack>
      </Box>

      {/* Form Dialog */}
      <StockDocumentFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        documentId={formDialogDocumentId}
        onClose={() => setFormDialogOpen(false)}
        onSuccess={handleFormDialogSuccess}
        tenantOptions={tenantOptions}
      />

      {/* Details Dialog */}
      <StockDocumentDetailsDialog
        open={detailsDialogOpen}
        documentId={detailsDialogDocumentId}
        onClose={() => setDetailsDialogOpen(false)}
        onEdit={handleDetailsDialogEdit}
        onPost={handleDetailsDialogPost}
        onDelete={handleDetailsDialogDelete}
      />

      {/* Post Dialog */}
      <PostStockDocumentDialog
        open={postDialogOpen}
        documentId={postDialogDocumentId}
        onClose={() => setPostDialogOpen(false)}
        onSuccess={handlePostDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Stock Document?"
        content={`Are you sure you want to delete stock document "${deleteDocumentIdDisplay}"? This action cannot be undone.`}
        action={
          <Field.Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Field.Button>
        }
        onClose={handleCancelDelete}
      />
    </>
  );
}

