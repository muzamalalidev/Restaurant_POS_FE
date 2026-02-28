'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createTenantSchema, updateTenantSchema } from 'src/schemas';
import { useCreateTenantMutation, useUpdateTenantMutation } from 'src/store/api/tenants-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { PhoneNumbersField } from './components/phone-numbers-field';

// ----------------------------------------------------------------------

/**
 * Tenant Form Dialog Component
 *
 * Single dialog for create and edit. Edit uses record from list (no getById).
 *
 * Dropdown analysis:
 * - No dropdowns in form. ownerId is a hidden field (edit only); when Owner API
 *   is added it can become an Autocomplete; submit already supports object
 *   (data.ownerId?.id ?? data.ownerId).
 * - phoneNumbers: array field (add/remove cards), no dropdowns; primary via Radio.
 * - No dependent dropdowns (no parent -> child chain).
 */
export function TenantFormDialog({ open, mode, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Mutations
  const [createTenant, { isLoading: isCreating }] = useCreateTenantMutation();
  const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantMutation();

  const isSubmitting = isCreating || isUpdating;
  const isSubmittingRef = useRef(false);

  // Determine schema based on mode
  const schema = mode === 'create' ? createTenantSchema : updateTenantSchema;

  // Form setup
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        name: '',
        description: null,
        ownerId: null,
        isActive: true,
        phoneNumbers: null,
      }),
      []
    ),
    mode: 'onChange',
  });

  const {
    reset,
    handleSubmit,
    formState: { isDirty },
  } = methods;

  // Load tenant data for edit mode from record or reset for create mode
  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        description: null,
        ownerId: null,
        isActive: true,
        phoneNumbers: null,
      });
      return;
    }

    if (mode === 'edit' && record) {
      reset({
        name: record.name || '',
        description: record.description || null,
        ownerId: record.ownerId || null,
        isActive: record.isActive ?? true,
        phoneNumbers: record.phoneNumbers?.map((phone) => ({
          id: phone.id,
          tenantId: phone.tenantId,
          phoneNumber: phone.phoneNumber,
          isPrimary: phone.isPrimary,
          label: phone.label || null,
          isActive: phone.isActive,
        })) || null,
      });
    } else {
      // create, or edit with no record (e.g. row no longer in list)
      reset({
        name: '',
        description: null,
        ownerId: null,
        isActive: true,
        phoneNumbers: null,
      });
    }
  }, [open, mode, record, reset]);

  // Handle form submit (ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      if (mode === 'create') {
        // Transform data for create: phoneNumbers should only have phoneNumber, isPrimary, label
        // Filter out phones with empty phoneNumber and convert empty array to null
        const validPhones = data.phoneNumbers?.filter((phone) => phone.phoneNumber?.trim()) || [];
        const createData = {
          name: data.name,
          description: data.description || null,
          phoneNumbers:
            validPhones.length > 0
              ? validPhones.map((phone) => ({
                  phoneNumber: phone.phoneNumber,
                  isPrimary: phone.isPrimary || false,
                  label: phone.label || null,
                }))
              : null,
        };
        const result = await createTenant(createData).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        // Transform data for update: include all phone fields, ensure tenantId matches
        // Per API spec: empty array [] = soft delete all phones, null = don't modify existing phones
        const ownerIdValue = data.ownerId?.id ?? data.ownerId ?? null;
        const validPhones = data.phoneNumbers?.filter((phone) => phone.phoneNumber?.trim()) || [];
        const updateData = {
          name: data.name,
          description: data.description || null,
          ownerId: ownerIdValue,
          isActive: data.isActive,
          phoneNumbers:
            validPhones.length > 0
              ? validPhones.map((phone) => ({
                  id: phone.id || '',
                  tenantId: record.id,
                  phoneNumber: phone.phoneNumber,
                  isPrimary: phone.isPrimary || false,
                  label: phone.label || null,
                  isActive: phone.isActive !== undefined ? phone.isActive : true,
                }))
              : [],
        };
        await updateTenant({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} tenant`,
      });
      toast.error(message);
    } finally {
      isSubmittingRef.current = false;
    }
  });

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return; // Prevent close during submit
    }
    
    // Check for unsaved changes
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
        {mode === 'create' ? 'Save' : 'Update'}
      </Field.Button>
    </Box>
  );

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Tenant' : 'Edit Tenant'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Tenant Information Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Tenant Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field.Text
                  name="name"
                  label="Name"
                  placeholder="Enter tenant name"
                  required
                />
                <Field.Text
                  name="description"
                  label="Description"
                  placeholder="Enter description (optional)"
                  multiline
                  rows={3}
                />
                {mode === 'edit' && (
                  <>
                    <Field.Switch name="isActive" label="Active" />
                    {/* Owner ID field - hidden for now, can be added later */}
                    <Field.Text
                      name="ownerId"
                      label="Owner ID"
                      placeholder="Enter owner ID (optional)"
                      sx={{ display: 'none' }}
                    />
                  </>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Phone Numbers Section */}
            <Box>
              <PhoneNumbersField name="phoneNumbers" mode={mode} />
            </Box>
          </Box>
        </Form>
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

