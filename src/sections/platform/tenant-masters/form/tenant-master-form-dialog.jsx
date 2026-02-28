'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme, useMediaQuery } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useGetUsersQuery } from 'src/store/api/users-api';
import { createTenantMasterSchema, updateTenantMasterSchema } from 'src/schemas';
import {
  useCreateTenantMasterMutation,
  useUpdateTenantMasterMutation,
} from 'src/store/api/tenant-masters-api';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { PhoneNumbersField } from 'src/sections/platform/tenants/form/components/phone-numbers-field';

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
  const [showPassword, setShowPassword] = useState(false);

  const [createTenantMaster, { isLoading: isCreating }] = useCreateTenantMasterMutation();
  const [updateTenantMaster, { isLoading: isUpdating }] = useUpdateTenantMasterMutation();

  const isSubmitting = isCreating || isUpdating;
  // P0-002: Ref guard to prevent double-submit (state updates async)
  const isSubmittingRef = useRef(false);
  const schema = mode === 'create' ? createTenantMasterSchema : updateTenantMasterSchema;

  // Load users for owner dropdown (update mode only)
  const { data: usersResponse } = useGetUsersQuery({ pageSize: 200 }, { skip: !open || mode !== 'edit' });

  const ownerOptions = useMemo(() => {
    if (!usersResponse?.data) return [];
    return usersResponse.data.map((user) => ({
      id: user.id,
      label: `${user.firstName || ''} ${user.lastName || ''} (${user.email || ''})`.trim() || user.id,
    }));
  }, [usersResponse]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        name: '',
        description: '',
        ownerId: null,
        isActive: true,
        // Owner creation fields (create mode only)
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: '',
        ownerPassword: '',
        ownerPhones: null,
      }),
      []
    ),
    mode: 'onChange',
  });

  const { reset, handleSubmit, formState: { isDirty } } = methods;

  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        description: '',
        ownerId: null,
        isActive: true,
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: '',
        ownerPassword: '',
        ownerPhones: null,
      });
      setShowPassword(false);
      return;
    }

    if (mode === 'edit' && record) {
      // Find owner in options for better display
      const ownerOption = ownerOptions.find((o) => o.id === record.ownerId);
      reset({
        name: record.name ?? '',
        description: record.description ?? '',
        ownerId: record.ownerId
          ? ownerOption || { id: record.ownerId, label: record.ownerId }
          : null,
        isActive: record.isActive ?? true,
        // Owner creation fields not used in edit mode
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: '',
        ownerPassword: '',
        ownerPhones: null,
      });
    } else {
      // create, or edit with no record (e.g. row no longer in list)
      reset({
        name: '',
        description: '',
        ownerId: null,
        isActive: true,
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: '',
        ownerPassword: '',
        ownerPhones: null,
      });
    }
  }, [open, mode, record, reset, ownerOptions]);

  // P0-002: ref guard blocks rapid double-submit
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      if (mode === 'create') {
        // Transform owner phones: filter empty, map to API format
        const validPhones = data.ownerPhones?.filter((phone) => phone?.phoneNumber?.trim()) || [];
        const ownerPhonesData =
          validPhones.length > 0
            ? validPhones.map((phone) => ({
                phoneNumber: phone.phoneNumber.trim(),
                isPrimary: phone.isPrimary || false,
                label: phone.label?.trim() || null,
              }))
            : null;

        const createData = {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          ownerFirstName: data.ownerFirstName.trim(),
          ownerLastName: data.ownerLastName.trim(),
          ownerEmail: data.ownerEmail.trim(),
          ownerPassword: data.ownerPassword,
          ownerPhones: ownerPhonesData,
        };
        const id = await createTenantMaster(createData).unwrap();
        if (onSuccess) onSuccess(id, 'created');
      } else {
        const ownerIdValue = data.ownerId?.id ?? data.ownerId ?? null;
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
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} tenant master`,
      });
      if (isRetryable) {
        toast.error(message, {
          action: { label: 'Retry', onClick: () => onSubmit() },
        });
      } else {
        toast.error(message);
      }
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
        maxWidth={mode === 'create' ? 'md' : 'sm'}
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={renderActions()}
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Tenant Master Information Section */}
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
              </Box>
            </Box>

            {mode === 'create' ? (
              <>
                <Divider sx={{ borderStyle: 'dashed' }} />
                {/* Owner User Creation Section (Create Mode Only) */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Owner User Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Field.Text
                        name="ownerFirstName"
                        label="First Name"
                        placeholder="Enter owner first name"
                        required
                        sx={{ flex: 1 }}
                      />
                      <Field.Text
                        name="ownerLastName"
                        label="Last Name"
                        placeholder="Enter owner last name"
                        required
                        sx={{ flex: 1 }}
                      />
                    </Box>
                    <Field.Text
                      name="ownerEmail"
                      label="Email"
                      placeholder="Enter owner email address"
                      type="email"
                      required
                    />
                    <Field.Text
                      name="ownerPassword"
                      label="Password"
                      placeholder="Enter password (min 6 characters)"
                      type={showPassword ? 'text' : 'password'}
                      required
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                sx={{ color: 'text.secondary' }}
                              >
                                <Iconify
                                  icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                                  width={20}
                                />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                      Password must contain at least 6 characters, one digit, one lowercase, and one uppercase letter
                    </Typography>
                    <PhoneNumbersField name="ownerPhones" mode="create" />
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Divider sx={{ borderStyle: 'dashed' }} />
                {/* Owner Assignment Section (Edit Mode Only) */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Owner Assignment
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    <Field.Switch name="isActive" label="Active" />
                  </Box>
                </Box>
              </>
            )}
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
