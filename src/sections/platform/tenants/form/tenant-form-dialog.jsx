'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

import { useGetTenantByIdQuery, useCreateTenantMutation, useUpdateTenantMutation } from 'src/store/api/tenants-api';
import { createTenantSchema, updateTenantSchema } from '../schemas/tenant-schema';
import { PhoneNumbersField } from './components/phone-numbers-field';

// ----------------------------------------------------------------------

/**
 * Tenant Form Dialog Component
 * 
 * Single dialog component for both create and edit operations.
 * Handles form state, validation, and API calls.
 */
export function TenantFormDialog({ open, mode, tenantId, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  // Fetch tenant data for edit mode
  const { data: tenantData, isLoading: isLoadingTenant, error: queryError, isError } = useGetTenantByIdQuery(tenantId, {
    skip: !tenantId || mode !== 'edit',
  });

  // Mutations
  const [createTenant, { isLoading: isCreating }] = useCreateTenantMutation();
  const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantMutation();

  const isSubmitting = isCreating || isUpdating;

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

  // Load tenant data for edit mode or reset for create mode
  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      reset({
        name: '',
        description: null,
        ownerId: null,
        isActive: true,
        phoneNumbers: null,
      });
      return;
    }

    if (mode === 'edit' && tenantData) {
      reset({
        name: tenantData.name || '',
        description: tenantData.description || null,
        ownerId: tenantData.ownerId || null,
        isActive: tenantData.isActive ?? true,
        phoneNumbers: tenantData.phoneNumbers?.map((phone) => ({
          id: phone.id,
          tenantId: phone.tenantId,
          phoneNumber: phone.phoneNumber,
          isPrimary: phone.isPrimary,
          label: phone.label || null,
          isActive: phone.isActive,
        })) || null,
      });
    } else if (mode === 'create') {
      reset({
        name: '',
        description: null,
        ownerId: null,
        isActive: true,
        phoneNumbers: null,
      });
    }
  }, [open, mode, tenantData, reset]);

  // Handle form submit
  const onSubmit = handleSubmit(async (data) => {
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
        // Filter out phones with empty phoneNumber
        // Per API spec: empty array [] = soft delete all phones, null = don't modify existing phones
        const validPhones = data.phoneNumbers?.filter((phone) => phone.phoneNumber?.trim()) || [];
        const updateData = {
          name: data.name,
          description: data.description || null,
          ownerId: data.ownerId || null,
          isActive: data.isActive,
          phoneNumbers:
            validPhones.length > 0
              ? validPhones.map((phone) => ({
                  id: phone.id || '', // Empty string for new phones, UUID for existing
                  tenantId: tenantId, // Must match path parameter (all phones belong to this tenant)
                  phoneNumber: phone.phoneNumber,
                  isPrimary: phone.isPrimary || false,
                  label: phone.label || null,
                  isActive: phone.isActive !== undefined ? phone.isActive : true,
                }))
              : [], // Empty array = soft delete all phones (per API spec)
        };
        await updateTenant({ id: tenantId, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(tenantId, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to save tenant:', error);
      toast.error(error?.data?.message || `Failed to ${mode === 'create' ? 'create' : 'update'} tenant`);
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
        Save
      </Field.Button>
    </Box>
  );

  // Loading state for edit mode
  const isLoading = mode === 'edit' && isLoadingTenant;
  const hasError = mode === 'edit' && isError;

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title={mode === 'create' ? 'Create Tenant' : 'Edit Tenant'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting || isLoading}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <Typography variant="body2" color="text.secondary">
              Loading tenant data...
            </Typography>
          </Box>
        ) : hasError ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
            <Typography variant="body1" color="error">
              Failed to load tenant data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {queryError?.data?.message || queryError?.message || 'Network Error'}
            </Typography>
          </Box>
        ) : (
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
        )}
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

