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
export function TenantFormDialog({ open, mode, record, onClose, onSuccess, tenantMasterOptions = [] }) {
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
        tenantMasterId: null,
        name: '',
        description: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        ownerId: null,
        isActive: true,
        phoneNumbers: null,
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: null,
        ownerPhones: null,
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
        tenantMasterId: null,
        name: '',
        description: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        ownerId: null,
        isActive: true,
        phoneNumbers: null,
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: null,
        ownerPhones: null,
      });
      return;
    }

    if (mode === 'edit' && record) {
      reset({
        tenantMasterId: record.tenantMasterId
          ? { id: record.tenantMasterId, label: record.tenantMasterName || record.tenantMasterId }
          : null,
        name: record.name || '',
        description: record.description || null,
        address: record.address || null,
        city: record.city || null,
        state: record.state || null,
        country: record.country || null,
        postalCode: record.postalCode || null,
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
        tenantMasterId: null,
        name: '',
        description: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        ownerId: null,
        isActive: true,
        phoneNumbers: null,
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: null,
        ownerPhones: null,
      });
    }
  }, [open, mode, record, reset]);

  // Handle form submit (ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      if (mode === 'create') {
        // Transform data for create: tenantMasterId required; owner block; phoneNumbers only phoneNumber, isPrimary, label
        const validPhones = data.phoneNumbers?.filter((phone) => phone.phoneNumber?.trim()) || [];
        const validOwnerPhones = data.ownerPhones?.filter((phone) => phone.phoneNumber?.trim()) || [];
        const tenantMasterIdValue = data.tenantMasterId?.id ?? data.tenantMasterId ?? null;
        const createData = {
          tenantMasterId: tenantMasterIdValue,
          name: data.name,
          description: data.description || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
          postalCode: data.postalCode || null,
          phoneNumbers:
            validPhones.length > 0
              ? validPhones.map((phone) => ({
                  phoneNumber: phone.phoneNumber,
                  isPrimary: phone.isPrimary || false,
                  label: phone.label || null,
                }))
              : null,
          ownerFirstName: data.ownerFirstName,
          ownerLastName: data.ownerLastName,
        };
        if (data.ownerEmail != null && String(data.ownerEmail).trim() !== '') {
          createData.ownerEmail = data.ownerEmail;
        }
        if (validOwnerPhones.length > 0) {
          createData.ownerPhones = validOwnerPhones.map((phone) => ({
            phoneNumber: phone.phoneNumber,
            isPrimary: phone.isPrimary || false,
            label: phone.label || null,
          }));
        }
        const result = await createTenant(createData).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        // Transform data for update: full DTO including tenantMasterId, address block, ownerId, phones
        const ownerIdValue = data.ownerId?.id ?? data.ownerId ?? null;
        const tenantMasterIdValue = data.tenantMasterId?.id ?? data.tenantMasterId ?? null;
        const validPhones = data.phoneNumbers?.filter((phone) => phone.phoneNumber?.trim()) || [];
        const updateData = {
          name: data.name,
          description: data.description || null,
          tenantMasterId: tenantMasterIdValue,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
          postalCode: data.postalCode || null,
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
                <Field.Autocomplete
                  name="tenantMasterId"
                  label="Tenant Master"
                  options={tenantMasterOptions}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    return option.label || option.id || '';
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return option === value;
                    return option.id === value.id;
                  }}
                  required={mode === 'create'}
                  slotProps={{
                    textField: {
                      placeholder: mode === 'create' ? 'Select tenant master' : 'Optional',
                    },
                  }}
                />
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

            {mode === 'create' && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Owner
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
                      <Field.Text
                        name="ownerFirstName"
                        label="Owner first name"
                        placeholder="First name"
                        required
                        sx={{ flex: 1, minWidth: 140 }}
                      />
                      <Field.Text
                        name="ownerLastName"
                        label="Owner last name"
                        placeholder="Last name"
                        required
                        sx={{ flex: 1, minWidth: 140 }}
                      />
                    </Box>
                    <Field.Text
                      name="ownerEmail"
                      label="Owner email"
                      placeholder="Leave empty to generate from tenant name"
                    />
                    <PhoneNumbersField name="ownerPhones" mode="create" />
                  </Box>
                </Box>
              </>
            )}

            <Divider />

            {/* Address Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Address
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field.Text
                  name="address"
                  label="Address"
                  placeholder="Street address (optional)"
                />
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
                  <Field.Text
                    name="city"
                    label="City"
                    placeholder="City (optional)"
                    sx={{ flex: 1, minWidth: 120 }}
                  />
                  <Field.Text
                    name="state"
                    label="State / Region"
                    placeholder="State or region (optional)"
                    sx={{ flex: 1, minWidth: 120 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
                  <Field.Text
                    name="country"
                    label="Country"
                    placeholder="Country (optional)"
                    sx={{ flex: 1, minWidth: 120 }}
                  />
                  <Field.Text
                    name="postalCode"
                    label="Postal Code"
                    placeholder="Postal code (optional)"
                    sx={{ flex: 1, minWidth: 120 }}
                  />
                </Box>
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

