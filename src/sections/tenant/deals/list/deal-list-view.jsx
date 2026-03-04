'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import { getApiErrorMessage } from 'src/utils/api-error-message';

import {
  useGetDealsQuery,
  useDeleteDealMutation,
  useToggleDealActiveMutation,
} from 'src/store/api/deals-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { CustomTable, DEFAULT_PAGINATION } from 'src/components/custom-table';

import { DealFormDialog } from '../form/deal-form-dialog';
import { DealDetailsDialog } from '../components/deal-details-dialog';
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

export function DealListView() {
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formDialogMode, setFormDialogMode] = useState('create');
  const [formDialogRecord, setFormDialogRecord] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogRecord, setDetailsDialogRecord] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteDealId, setDeleteDealId] = useState(null);
  const [deleteDealName, setDeleteDealName] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGINATION.pageSize);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const searchForm = useForm({
    defaultValues: { searchTerm: '' },
  });

  const watchedSearchTerm = searchForm.watch('searchTerm');
  useEffect(() => {
    setSearchTerm(watchedSearchTerm || '');
  }, [watchedSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageNumber(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryParams = useMemo(
    () => ({
      pageNumber,
      pageSize,
      searchTerm: debouncedSearchTerm.trim() || undefined,
      includeItems: true,
    }),
    [pageNumber, pageSize, debouncedSearchTerm]
  );

  const { data: response, isLoading, error, refetch } = useGetDealsQuery(queryParams);

  const deals = useMemo(() => response?.data ?? [], [response]);

  const paginationMeta = useMemo(
    () => ({
      pageNumber: response?.pageNumber ?? pageNumber,
      pageSize: response?.pageSize ?? pageSize,
      totalCount: response?.totalCount ?? 0,
      totalPages: response?.totalPages ?? 0,
      hasPreviousPage: response?.hasPreviousPage ?? false,
      hasNextPage: response?.hasNextPage ?? false,
    }),
    [response, pageNumber, pageSize]
  );

  const [deleteDeal, { isLoading: isDeleting }] = useDeleteDealMutation();
  const [toggleDealActive] = useToggleDealActiveMutation();
  const [togglingDealId, setTogglingDealId] = useState(null);
  const inFlightIdsRef = useRef(new Set());

  const handleCreate = useCallback(() => {
    setFormDialogMode('create');
    setFormDialogRecord(null);
    setFormDialogOpen(true);
  }, []);

  const handleEdit = useCallback(
    (row) => {
      const record = deals.find((d) => d.id === row.id) ?? null;
      setFormDialogMode('edit');
      setFormDialogRecord(record);
      setFormDialogOpen(true);
    },
    [deals]
  );

  const handleView = useCallback(
    (row) => {
      const record = deals.find((d) => d.id === row.id) ?? null;
      setDetailsDialogRecord(record);
      setDetailsDialogOpen(true);
    },
    [deals]
  );

  const handleDeleteClick = useCallback((row) => {
    setDeleteDealId(row.id);
    setDeleteDealName(row.name);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteDealId) return;
    try {
      await deleteDeal(deleteDealId).unwrap();
      toast.success('Deal deleted successfully');
      setDeleteConfirmOpen(false);
      setDeleteDealId(null);
      setDeleteDealName(null);
      if (deals.length === 1 && pageNumber > 1) {
        setPageNumber((p) => p - 1);
      }
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to delete deal',
        notFoundMessage: 'Deal not found or already deleted.',
      });
      toast.error(message);
    }
  }, [deleteDealId, deleteDeal, deals.length, pageNumber]);

  const handleToggleActive = useCallback(
    async (dealId) => {
      if (inFlightIdsRef.current.has(dealId)) return;
      inFlightIdsRef.current.add(dealId);
      setTogglingDealId(dealId);
      try {
        await toggleDealActive(dealId).unwrap();
        toast.success('Deal status updated successfully');
      } catch (err) {
        const { message } = getApiErrorMessage(err, {
          defaultMessage: 'Failed to update deal status',
          notFoundMessage: 'Deal not found or already deleted.',
        });
        toast.error(message);
      } finally {
        inFlightIdsRef.current.delete(dealId);
        setTogglingDealId(null);
      }
    },
    [toggleDealActive]
  );

  const handleFormSuccess = useCallback(
    (id, action) => {
      setFormDialogOpen(false);
      setFormDialogMode('create');
      setFormDialogRecord(null);
      toast.success(`Deal ${action} successfully`);
      refetch();
    },
    [refetch]
  );

  const handleFormClose = useCallback(() => {
    setFormDialogOpen(false);
    setFormDialogMode('create');
    setFormDialogRecord(null);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPageNumber(newPage + 1);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPageNumber(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    searchForm.setValue('searchTerm', '');
    setSearchTerm('');
    setPageNumber(1);
  }, [searchForm]);

  const rows = useMemo(
    () =>
      deals.map((deal) => ({
        id: deal.id,
        name: deal.name,
        description: deal.description ?? '-',
        price: deal.price,
        priceFormatted: formatPrice(deal.price),
        startDate: deal.startDate,
        startDateFormatted: formatDate(deal.startDate),
        endDate: deal.endDate,
        endDateFormatted: formatDate(deal.endDate),
        isActive: deal.isActive,
        items: deal.items ?? [],
      })),
    [deals]
  );

  const columns = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'priceFormatted',
        headerName: 'Price',
        flex: 1,
      },
      {
        field: 'startDateFormatted',
        headerName: 'Start Date',
        flex: 1,
      },
      {
        field: 'endDateFormatted',
        headerName: 'End Date',
        flex: 1,
      },
      {
        field: 'isActive',
        headerName: 'Status',
        flex: 1,
        renderCell: (params) => (
          <Label color={getActiveStatusColor(params.value)} variant="soft">
            {getActiveStatusLabel(params.value)}
          </Label>
        ),
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        id: 'view',
        label: 'View',
        icon: 'solar:eye-bold',
        onClick: (row) => handleView(row),
        order: 1,
      },
      {
        id: 'edit',
        label: 'Edit',
        icon: 'solar:pen-bold',
        onClick: (row) => handleEdit(row),
        order: 2,
      },
      {
        id: 'toggle-active',
        label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
        icon: (row) => (
          <Switch
            checked={!!row.isActive}
            size="small"
            disabled={togglingDealId === row.id}
            onChange={(e) => {
              e.stopPropagation();
              handleToggleActive(row.id);
            }}
            onClick={(e) => e.stopPropagation()}
            slotProps={{
              input: {
                id: `deal-toggle-active-${row.id}`,
                'aria-label': `Toggle active status for ${row.name || 'deal'}`,
              },
            }}
          />
        ),
        order: 3,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        onClick: (row) => handleDeleteClick(row),
        order: 4,
      },
    ],
    [handleView, handleEdit, handleToggleActive, handleDeleteClick, togglingDealId]
  );

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <FormProvider {...searchForm}>
            <Field.Text
              name="searchTerm"
              size="small"
              placeholder="Search by name or description..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleSearchClear}
                        sx={{ minWidth: 'auto', minHeight: 'auto', p: 0.5 }}
                        aria-label="Clear search"
                      >
                        <Iconify icon="eva:close-fill" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
              sx={{ maxWidth: { sm: 400 } }}
            />
          </FormProvider>
          <Field.Button
            variant="contained"
            startIcon="mingcute:add-line"
            onClick={handleCreate}
            sx={{ ml: 'auto', minHeight: 44 }}
          >
            Create Deal
          </Field.Button>
        </Stack>

        <CustomTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          actions={actions}
          error={error}
          onRetry={refetch}
          errorEntityLabel="deals"
          pagination={{
            ...DEFAULT_PAGINATION,
            mode: 'server',
            page: pageNumber - 1,
            pageSize,
            rowCount: paginationMeta.totalCount,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          getRowId={(row) => row.id}
          emptyContent={
            <EmptyContent
              title="No deals found"
              description={
                searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating a new deal'
              }
            />
          }
        />
      </Card>

      <DealFormDialog
        open={formDialogOpen}
        mode={formDialogMode}
        record={formDialogRecord}
        existingDeals={deals}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      <DealDetailsDialog
        open={detailsDialogOpen}
        record={detailsDialogRecord}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsDialogRecord(null);
        }}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Deal"
        content={
          deleteDealName
            ? `Are you sure you want to delete "${deleteDealName}"? This action cannot be undone.`
            : 'Are you sure you want to delete this deal? This action cannot be undone.'
        }
        action={
          <Field.Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            loading={isDeleting}
          >
            Delete
          </Field.Button>
        }
        loading={isDeleting}
        disableClose={isDeleting}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteDealId(null);
          setDeleteDealName(null);
        }}
      />
    </Box>
  );
}
