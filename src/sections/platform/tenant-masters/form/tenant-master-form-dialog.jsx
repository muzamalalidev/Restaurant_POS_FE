'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';
import { toast } from 'src/components/snackbar';

import {
  useGetTenantMasterByIdQuery,
  useCreateTenantMasterMutation,
  useUpdateTenantMasterMutation,
} from 'src/store/api/tenant-masters-api';
import { createTenantMasterSchema, updateTenantMasterSchema } from '../schemas/tenant-master-schema';

// ----------------------------------------------------------------------

/**
 * Tenant Master Form Dialog
 * Single dialog for create and edit. Create returns 201 with raw Guid.
 */
export function TenantMasterFormDialog({ open, mode, tenantMasterId, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // P2-003: skip when dialog closed to avoid unnecessary requests
  const { data: tenantMasterData, isLoading: isLoadingTenantMaster, error: queryError, isError, refetch: refetchTenantMaster } = useGetTenantMasterByIdQuery(
    tenantMasterId,
    { skip: !tenantMasterId || mode !== 'edit' || !open }
  );

  const [createTenantMaster, { isLoading: isCreating }] = useCreateTenantMasterMutation();
  const [updateTenantMaster, { isLoading: isUpdating }] = useUpdateTenantMasterMutation();

  const isSubmitting = isCreating || isUpdating;
  // P0-002: Ref guard to prevent double-submit (state updates async)
  const isSubmittingRef = useRef(false);
  const schema = mode === 'create' ? createTenantMasterSchema : updateTenantMasterSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        name: '',
        description: '',
        ownerId: null,
        isActive: true,
      }),
      []
    ),
    mode: 'onChange',
  });

  const { reset, handleSubmit, formState: { isDirty } } = methods;

  // P1-003: Empty until owner/user API is integrated
  const ownerOptions = useMemo(() => [], []);

  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        description: '',
        ownerId: null,
        isActive: true,
      });
      return;
    }

    if (mode === 'edit' && tenantMasterData) {
      reset({
        name: tenantMasterData.name ?? '',
        description: tenantMasterData.description ?? '',
        ownerId: tenantMasterData.ownerId
          ? { id: tenantMasterData.ownerId, label: tenantMasterData.ownerId }
          : null,
        isActive: tenantMasterData.isActive ?? true,
      });
    } else if (mode === 'create') {
      reset({
        name: '',
        description: '',
        ownerId: null,
        isActive: true,
      });
    }
  }, [open, mode, tenantMasterData, reset]);

  // P0-002: ref guard blocks rapid double-submit
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const ownerIdValue = data.ownerId?.id ?? data.ownerId ?? null;

      if (mode === 'create') {
        const createData = {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          ownerId: ownerIdValue || null,
        };
        const id = await createTenantMaster(createData).unwrap();
        if (onSuccess) onSuccess(id, 'created');
      } else {
        const updateData = {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          ownerId: ownerIdValue || null,
          isActive: data.isActive,
        };
        await updateTenantMaster({ id: tenantMasterId, ...updateData }).unwrap();
        if (onSuccess) onSuccess(tenantMasterId, 'updated');
      }
      reset();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || err?.data?.detail || `Failed to ${mode === 'create' ? 'create' : 'update'} tenant master`);
    } finally {
      isSubmittingRef.current = false;
    }
  });

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    if (isDirty) {
      setUnsavedChangesDialogOpen(true);
      return;
    }
    reset();
    onClose();
  }, [isSubmitting, isDirty, reset, onClose]);

  const handleConfirmDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
    reset();
    onClose();
  }, [reset, onClose]);

  const handleCancelDiscard = useCallback(() => {
    setUnsavedChangesDialogOpen(false);
  }, []);

  const renderActions = () => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <Field.Button variant="outlined" color="inherit" onClick={handleClose} disabled={isSubmitting}>
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
        Save
      </Field.Button>
    </Box>
  );

  const isLoading = mode === 'edit' && isLoadingTenantMaster;
  const hasError = mode === 'edit' && isError;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Tenant Master' : 'Edit Tenant Master'}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting || isLoading}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Typography variant="body2" color="text.secondary">
              Loading tenant master...
            </Typography>
          </Box>
        ) : hasError ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
            <Typography variant="body1" color="error">
              Failed to load tenant master
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {queryError?.data?.message || queryError?.data?.detail || queryError?.message || 'Not found'}
            </Typography>
            <Field.Button variant="contained" onClick={() => refetchTenantMaster()} startIcon="solar:refresh-bold">
              Retry
            </Field.Button>
          </Box>
        ) : (
          <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Tenant Master Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Field.Text
                    name="name"
                    label="Name"
                    placeholder="Enter tenant master name"
                    required
                    inputProps={{ maxLength: 200 }}
                    characterCounter
                  />
                  <Field.Text
                    name="description"
                    label="Description"
                    placeholder="Enter description (optional)"
                    multiline
                    rows={3}
                    inputProps={{ maxLength: 1000 }}
                    characterCounter
                  />
                  <Field.Autocomplete
                    name="ownerId"
                    label="Owner"
                    options={ownerOptions}
                    getOptionLabel={(option) => (option ? (option.label ?? option.name ?? option.id ?? '') : '')}
                    isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        placeholder: 'None (assign later)',
                      },
                    }}
                  />
                  {mode === 'edit' && <Field.Switch name="isActive" label="Active" />}
                </Box>
              </Box>
            </Box>
          </Form>
        )}
      </CustomDialog>

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
