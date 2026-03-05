'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createBranchSchema, updateBranchSchema } from 'src/schemas';
import { useCreateBranchMutation, useUpdateBranchMutation } from 'src/store/api/branches-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

import { PhoneNumbersField } from './components/phone-numbers-field';

// ----------------------------------------------------------------------

const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;
  return phoneNumber.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '');
};

// ----------------------------------------------------------------------

/**
 * Branch Form Dialog Component
 *
 * Single dialog for create and edit. Edit uses record from list (no getById).
 * Platform scope: tenantOptions from list view; tenantId required in form.
 */
export function BranchFormDialog({ open, mode, record, onClose, onSuccess, tenantOptions = [] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const [originalPhoneNumbers, setOriginalPhoneNumbers] = useState(null);

  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const isSubmitting = isCreating || isUpdating;
  const isSubmittingRef = useRef(false);

  const schema = mode === 'create' ? createBranchSchema : updateBranchSchema;

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        tenantId: null,
        name: '',
        address: null,
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
    getValues,
    setValue,
    formState: { isDirty },
  } = methods;

  const formInitializedRef = useRef(false);
  const previousBranchIdRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setOriginalPhoneNumbers(null);
      formInitializedRef.current = false;
      previousBranchIdRef.current = null;
      reset({
        tenantId: null,
        name: '',
        address: null,
        isActive: true,
        phoneNumbers: null,
        ownerFirstName: '',
        ownerLastName: '',
        ownerEmail: null,
        ownerPhones: null,
      });
      return;
    }

    const currentBranchId = mode === 'edit' ? record?.id : 'create';
    const shouldInitialize = !formInitializedRef.current || previousBranchIdRef.current !== currentBranchId;

    if (shouldInitialize) {
      if (mode === 'edit' && record) {
        const matchingTenant = record.tenantId && tenantOptions.length > 0
          ? tenantOptions.find((t) => t.id === record.tenantId)
          : null;

        const phoneNumbersData = record.phoneNumbers?.map((phone) => ({
          id: phone.id,
          branchId: phone.branchId,
          phoneNumber: phone.phoneNumber,
          isPrimary: phone.isPrimary,
          phoneLabel: phone.phoneLabel || null,
          isActive: phone.isActive,
        })) || null;

        setOriginalPhoneNumbers(phoneNumbersData);

        reset({
          tenantId: matchingTenant || null,
          name: record.name || '',
          address: record.address || null,
          isActive: record.isActive ?? true,
          phoneNumbers: phoneNumbersData,
        });

        formInitializedRef.current = true;
        previousBranchIdRef.current = currentBranchId;
      } else if (mode === 'create') {
        setOriginalPhoneNumbers(null);
        reset({
          tenantId: null,
          name: '',
          address: null,
          isActive: true,
          phoneNumbers: null,
          ownerFirstName: '',
          ownerLastName: '',
          ownerEmail: null,
          ownerPhones: null,
        });

        formInitializedRef.current = true;
        previousBranchIdRef.current = currentBranchId;
      } else {
        setOriginalPhoneNumbers(null);
        reset({
          tenantId: null,
          name: '',
          address: null,
          isActive: true,
          phoneNumbers: null,
          ownerFirstName: '',
          ownerLastName: '',
          ownerEmail: null,
          ownerPhones: null,
        });
        formInitializedRef.current = true;
        previousBranchIdRef.current = currentBranchId;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.id, reset]);

  useEffect(() => {
    if (open && mode === 'edit' && record?.tenantId && tenantOptions.length > 0) {
      const matchingTenant = tenantOptions.find((t) => t.id === record.tenantId);
      if (matchingTenant) {
        const currentValue = getValues('tenantId');
        const currentId = typeof currentValue === 'object' && currentValue !== null ? currentValue.id : currentValue;
        if (currentId !== matchingTenant.id) {
          setValue('tenantId', matchingTenant, { shouldValidate: false, shouldDirty: false });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, record?.tenantId, tenantOptions.length]);

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const tenantIdValue = typeof data.tenantId === 'object' && data.tenantId !== null
        ? data.tenantId.id
        : data.tenantId;

      if (mode === 'create') {
        const validPhones = data.phoneNumbers?.filter((phone) => phone.phoneNumber?.trim()) || [];
        const validOwnerPhones = data.ownerPhones?.filter((phone) => phone.phoneNumber?.trim()) || [];
        const createData = {
          tenantId: tenantIdValue,
          name: data.name,
          address: data.address || null,
          phoneNumbers:
            validPhones.length > 0
              ? validPhones.map((phone) => ({
                  phoneNumber: normalizePhoneNumber(phone.phoneNumber),
                  isPrimary: phone.isPrimary || false,
                  phoneLabel: phone.phoneLabel || null,
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
            phoneNumber: normalizePhoneNumber(phone.phoneNumber),
            isPrimary: phone.isPrimary || false,
            label: phone.label || null,
          }));
        }
        const result = await createBranch(createData).unwrap();
        if (onSuccess) {
          onSuccess(result, 'created');
        }
      } else {
        const validPhones = data.phoneNumbers?.filter((phone) => phone.phoneNumber?.trim()) || [];

        let phoneNumbersValue;
        const wasPhoneNumbersNull = originalPhoneNumbers === null || originalPhoneNumbers === undefined;
        const isPhoneNumbersEmpty = !data.phoneNumbers || data.phoneNumbers.length === 0 || validPhones.length === 0;

        if (wasPhoneNumbersNull && isPhoneNumbersEmpty) {
          phoneNumbersValue = null;
        } else if (validPhones.length > 0) {
          phoneNumbersValue = validPhones.map((phone) => ({
            id: phone.id || '',
            branchId: record.id,
            phoneNumber: normalizePhoneNumber(phone.phoneNumber),
            isPrimary: phone.isPrimary || false,
            phoneLabel: phone.phoneLabel || null,
            isActive: phone.isActive !== undefined ? phone.isActive : true,
          }));
        } else {
          phoneNumbersValue = [];
        }

        const updateData = {
          tenantId: tenantIdValue,
          name: data.name,
          address: data.address || null,
          isActive: data.isActive,
          phoneNumbers: phoneNumbersValue,
        };
        await updateBranch({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) {
          onSuccess(record.id, 'updated');
        }
      }
      reset();
      onClose();
    } catch (error) {
      const { message } = getApiErrorMessage(error, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} branch`,
        notFoundMessage: 'Branch or tenant not found',
        validationMessage: 'Validation failed. Please check your input.',
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
        title={mode === 'create' ? 'Create Branch' : 'Edit Branch'}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
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
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Branch Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Field.Autocomplete
                    name="tenantId"
                    label="Tenant"
                    options={tenantOptions}
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
                        placeholder: 'Select tenant',
                        required: true,
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Field.Text
                    name="name"
                    label="Name"
                    placeholder="Enter branch name"
                    required
                    slotProps={{
                      input: {
                        maxLength: 200,
                      },
                    }}
                    sx={{ flex: 1 }}
                  />
                </Box>
                <Field.Text
                  name="address"
                  label="Address"
                  placeholder="Enter address (optional)"
                  multiline
                  rows={3}
                  slotProps={{
                    input: {
                      maxLength: 1000,
                    },
                  }}
                />
                {mode === 'edit' && (
                  <Field.Switch name="isActive" label="Active" />
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
                      placeholder="Leave empty to generate from branch name"
                    />
                    <PhoneNumbersField name="ownerPhones" mode="create" />
                  </Box>
                </Box>
              </>
            )}

            <Divider />

            <Box>
              <PhoneNumbersField name="phoneNumbers" mode={mode} />
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
