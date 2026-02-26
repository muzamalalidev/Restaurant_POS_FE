'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createTableSchema, updateTableSchema } from 'src/schemas';
import { useGetBranchesDropdownQuery } from 'src/store/api/branches-api';
import { useGetAllTablesQuery, useCreateTableMutation, useUpdateTableMutation } from 'src/store/api/tables-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Helper function to extract ID from object or string
 */
const getId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return value.id;
  }
  return value;
};

// ----------------------------------------------------------------------

/**
 * Table Form Dialog Component
 * 
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 * 
 * Note: GetById endpoint is a placeholder, so we use getAllTables with branchId filter
 * and client-side filtering by ID to get table data for edit mode.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string} props.mode - 'create' or 'edit'
 * @param {string|null} props.tableId - Table ID for edit mode
 * @param {string|null} props.branchId - Branch ID (required for fetching table data in edit mode)
 * @param {Function} props.onClose - Callback when dialog closes
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 * @param {Array} props.branchOptions - Branch options for dropdown (from list view)
 */
export function TableFormDialog({ open, mode, tableId, branchId, onClose, onSuccess, branchOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  const { data: branchesDropdownFallback } = useGetBranchesDropdownQuery(undefined, { skip: branchOptions.length > 0 });
  const effectiveBranchOptions = useMemo(() => {
    if (branchOptions.length > 0) return branchOptions;
    if (!branchesDropdownFallback || !Array.isArray(branchesDropdownFallback)) return [];
    return branchesDropdownFallback.map((item) => ({ id: item.key, label: item.value || item.key }));
  }, [branchOptions, branchesDropdownFallback]);

  // Fetch table data for edit mode (P0-003/P1-003: pageSize 200; getTableById is placeholder - find by ID in response)
  const { data: tablesResponse, isLoading: isLoadingTable, error: queryError, isError: _isError, refetch: refetchTable } = useGetAllTablesQuery(
    {
      branchId: getId(branchId),
      pageSize: 200,
    },
    {
      skip: !tableId || mode !== 'edit' || !branchId || !open,
    }
  );

  // Find the table by ID from the response
  const tableData = useMemo(() => {
    if (!tablesResponse || !tableId) return null;
    const tables = tablesResponse.data || [];
    return tables.find((table) => table.id === tableId) || null;
  }, [tablesResponse, tableId]);

  // Mutations
  const [createTable, { isLoading: isCreating }] = useCreateTableMutation();
  const [updateTable, { isLoading: isUpdating }] = useUpdateTableMutation();

  const isSubmitting = isCreating || isUpdating;
  // P0-002: Ref guard to prevent double-submit
  const isSubmittingRef = useRef(false);

  // Determine schema based on mode
  const schema = mode === 'create' ? createTableSchema : updateTableSchema;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        branchId: null,
        tableNumber: '',
        capacity: 1,
        location: null,
        isAvailable: true,
        isActive: true,
      }),
      []
    ),
    mode: 'onChange',
  });

  const {
    reset,
    handleSubmit,
    getValues,
    setValue,
    watch: _watch,
    formState: { isDirty },
  } = methods;

  // Track if form has been initialized
  const formInitializedRef = useRef(false);
  const previousTableIdRef = useRef(null);

  // Load table data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      formInitializedRef.current = false;
      previousTableIdRef.current = null;
      reset({
        branchId: null,
        tableNumber: '',
        capacity: 1,
        location: null,
        isAvailable: true,
        isActive: true,
      });
      return;
    }

    const currentTableId = mode === 'edit' ? tableId : 'create';
    const shouldInitialize = !formInitializedRef.current || previousTableIdRef.current !== currentTableId;

    if (shouldInitialize) {
      if (mode === 'edit' && tableData) {
        const matchingBranch = tableData.branchId && effectiveBranchOptions.length > 0
          ? effectiveBranchOptions.find((b) => b.id === tableData.branchId)
          : null;

        reset({
          branchId: matchingBranch || null,
          tableNumber: tableData.tableNumber || '',
          capacity: tableData.capacity || 1,
          location: tableData.location || null,
          isAvailable: tableData.isAvailable ?? true,
          isActive: tableData.isActive ?? true,
        });

        formInitializedRef.current = true;
        previousTableIdRef.current = currentTableId;
      } else if (mode === 'create') {
        // Pre-select branch if provided
        const branchToSelect = getId(branchId) && effectiveBranchOptions.length > 0
          ? effectiveBranchOptions.find((b) => b.id === getId(branchId))
          : null;

        reset({
          branchId: branchToSelect || null,
          tableNumber: '',
          capacity: 1,
          location: null,
          isAvailable: true,
          isActive: true,
        });

        formInitializedRef.current = true;
        previousTableIdRef.current = currentTableId;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, tableId, tableData?.id, reset]);

  // Separate effect to update branchId when branchOptions become available in edit mode
  useEffect(() => {
    if (open && mode === 'edit' && tableData?.branchId && effectiveBranchOptions.length > 0) {
      const matchingBranch = effectiveBranchOptions.find((b) => b.id === tableData.branchId);
      if (matchingBranch) {
        const currentValue = getValues('branchId');
        const currentId = typeof currentValue === 'object' && currentValue !== null ? currentValue.id : currentValue;
        if (currentId !== matchingBranch.id) {
          setValue('branchId', matchingBranch, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, tableData?.branchId, effectiveBranchOptions.length]);

  // Handle form submit (P0-002: ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      // Extract branchId: if it's an object, get the id; if it's a string, use it directly
      const branchIdValue = typeof data.branchId === 'object' && data.branchId !== null
        ? data.branchId.id
        : data.branchId;

      const payload = {
        branchId: branchIdValue,
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        location: data.location || null,
        isAvailable: data.isAvailable ?? true,
        isActive: data.isActive ?? true,
      };

      if (mode === 'create') {
        const result = await createTable(payload).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        await updateTable({ id: tableId, ...payload }).unwrap();
        if (onSuccess) {
          onSuccess(tableId, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save table:', error);
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} table`,
        notFoundMessage: 'Table or branch not found',
        validationMessage: 'Validation failed. Please check your input.',
      });
      toast.error(message);
    } finally {
      isSubmittingRef.current = false;
    }
  });

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    if (isDirty) {
      setUnsavedChangesDialogOpen(true);
      return;
    }

    reset();
    onClose();
  }, [isSubmitting, isDirty, reset, onClose]);

  // Handle confirm discard changes
  const handleConfirmDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
    reset();
    onClose();
  }, [reset, onClose]);

  // Handle cancel discard changes
  const handleCancelDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
  }, []);

  // Render actions
  const renderActions = () => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <Field.Button
        variant="outlined"
        color="inherit"
        onClick={handleClose}
        disabled={isSubmitting}
      >
        Cancel
      </Field.Button>
      <Field.Button
        variant="contained"
        type="submit"
        onClick={onSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        startIcon="solar:check-circle-bold"
        sx={{ minHeight: 44 }}
      >
        {mode === 'create' ? 'Create' : 'Update'}
      </Field.Button>
    </Box>
  );

  // Loading state for edit mode
  const isLoading = mode === 'edit' && isLoadingTable;
  const hasError = mode === 'edit' && !tableData && !isLoadingTable && tableId && open;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Table' : 'Edit Table'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting || isLoading}
        disableClose={isSubmitting}
        actions={renderActions()}
        slotProps={{
          paper: {
            sx: {
              maxHeight: isMobile ? '100vh' : '80vh',
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <QueryStateContent
          isLoading={isLoading}
          isError={hasError}
          error={queryError}
          onRetry={refetchTable}
          loadingMessage="Loading table data..."
          errorTitle="Failed to load table data"
          errorMessageOptions={{
            defaultMessage: 'Failed to load table data',
            notFoundMessage: 'Table not found or an error occurred.',
          }}
        >
          <Form methods={methods} onSubmit={onSubmit}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                pt: 1,
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* Table Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Table Information
                </Typography>
                <Stack spacing={2}>
                  {/* Branch */}
                  <Field.Autocomplete
                    name="branchId"
                    label="Branch"
                    options={effectiveBranchOptions}
                    required
                    disabled={mode === 'edit'}
                    getOptionLabel={(option) => {
                      if (!option) return '';
                      return option.label || option.name || option.id || '';
                    }}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return option === value;
                      return option.id === value.id;
                    }}
                    slotProps={{
                      textField: {
                        placeholder: 'Select branch',
                      },
                    }}
                  />

                  {/* Table Number */}
                  <Field.Text
                    name="tableNumber"
                    label="Table Number"
                    placeholder="e.g., T-101, Table 5"
                    required
                  />

                  {/* Capacity */}
                  <Field.NumberInput
                    name="capacity"
                    label="Capacity"
                    placeholder="Number of seats"
                    required
                    slotProps={{
                      input: {
                        inputProps: {
                          min: 1,
                        },
                      },
                    }}
                  />

                  {/* Location */}
                  <Field.Text
                    name="location"
                    label="Location"
                    placeholder="e.g., Window, Outdoor, Main Hall"
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Status Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Status
                </Typography>
                <Stack spacing={2}>
                  <Field.Switch
                    name="isAvailable"
                    label="Available"
                  />
                  <Field.Switch
                    name="isActive"
                    label="Active"
                  />
                </Stack>
              </Box>
            </Box>
          </Form>
        </QueryStateContent>
      </CustomDialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmDialog
        open={unsavedChangesDialogOpen}
        title="Discard Changes?"
        content="You have unsaved changes. Are you sure you want to close without saving?"
        action={
          <Field.Button variant="contained" color="error" onClick={handleConfirmDiscard}>
            Discard
          </Field.Button>
        }
        onClose={handleCancelDiscard}
      />
    </>
  );
}

