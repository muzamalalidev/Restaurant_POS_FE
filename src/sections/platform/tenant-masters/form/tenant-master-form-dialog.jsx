'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createTenantMasterSchema, updateTenantMasterSchema } from 'src/schemas';
import {
  useCreateTenantMasterMutation,
  useUpdateTenantMasterMutation,
} from 'src/store/api/tenant-masters-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Tenant Master Form Dialog
 * Single dialog for create and edit. Create returns 201 with raw Guid.
 * Edit/Detail: uses record from list (no getById).
 *
 * Dropdown analysis:
 * - ownerId: API-based (options placeholder until owner/user API). Single select.
 *   Not dependent on any other field. Edit maps record.ownerId to { id, label }
 *   for Autocomplete; submit extracts id via data.ownerId?.id ?? data.ownerId.
 * - No dependent dropdowns (no parent -> child chain). When Owner API is
 *   integrated: load options when dialog opens; in edit, map selected value to
 *   option in list by id so the value is in options (or keep freeSolo-style
 *   display for existing GUIDs not in options).
 */
export function TenantMasterFormDialog({ open, mode, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

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

    if (mode === 'edit' && record) {
      reset({
        name: record.name ?? '',
        description: record.description ?? '',
        ownerId: record.ownerId
          ? { id: record.ownerId, label: record.ownerId }
          : null,
        isActive: record.isActive ?? true,
      });
    } else {
      // create, or edit with no record (e.g. row no longer in list)
      reset({
        name: '',
        description: '',
        ownerId: null,
        isActive: true,
      });
    }
  }, [open, mode, record, reset]);

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
        await updateTenantMaster({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) onSuccess(record.id, 'updated');
      }
      reset();
      onClose();
    } catch (err) {
      const { message } = getApiErrorMessage(err, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} tenant master`,
      });
      toast.error(message);
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
      {mode === 'create' ? 'Save' : 'Update'}
      </Field.Button>
    </Box>
  );

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Tenant Master' : 'Edit Tenant Master'}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box>
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
                      placeholder: 'None (assign later)',
                    },
                  }}
                />
                {mode === 'edit' && <Field.Switch name="isActive" label="Active" />}
              </Box>
            </Box>
          </Box>
        </Form>
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
