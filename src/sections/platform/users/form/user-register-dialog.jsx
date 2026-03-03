'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme, useMediaQuery } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';

import { can } from 'src/utils/permissions';
import { getApiErrorMessage } from 'src/utils/api-error-message';

import { registerUserScopedSchema } from 'src/schemas';
import {
  useRegisterBranchUserMutation,
  useRegisterTenantUserMutation,
  useRegisterTenantMasterUserMutation,
} from 'src/store/api/users-api';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

const SCOPE_OPTIONS = [
  { id: 'tenant-master', label: 'Tenant Master' },
  { id: 'tenant', label: 'Tenant' },
  { id: 'branch', label: 'Branch' },
];

// ----------------------------------------------------------------------

/**
 * User Register Dialog Component
 *
 * Supports three register flows: tenant-master, tenant, branch.
 * Scope selector determines which mutation and scope ID field to use.
 */
export function UserRegisterDialog({
  open,
  onClose,
  onSuccess,
  tenantMasterOptions = [],
  tenantOptions = [],
  branchOptions = [],
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [registerTenantMasterUser, { isLoading: isRegisteringTM }] = useRegisterTenantMasterUserMutation();
  const [registerTenantUser, { isLoading: isRegisteringTenant }] = useRegisterTenantUserMutation();
  const [registerBranchUser, { isLoading: isRegisteringBranch }] = useRegisterBranchUserMutation();

  const isSubmitting = isRegisteringTM || isRegisteringTenant || isRegisteringBranch;
  const isSubmittingRef = useRef(false);

  const canRegisterTM = can('Users.RegisterTenantMasterUser');
  const canRegisterTenant = can('Users.RegisterTenantUser');
  const canRegisterBranch = can('Users.RegisterBranchUser');

  const roleOptions = useMemo(
    () => [
      { id: 'Admin', label: 'Admin' },
      { id: 'Manager', label: 'Manager' },
      { id: 'Staff', label: 'Staff' },
      { id: 'Cashier', label: 'Cashier' },
    ],
    []
  );

  const methods = useForm({
    resolver: zodResolver(registerUserScopedSchema),
    defaultValues: useMemo(
      () => ({
        scope: SCOPE_OPTIONS[0],
        email: '',
        password: '',
        userName: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        tenantMasterId: null,
        tenantId: null,
        branchId: null,
        role: null,
      }),
      []
    ),
    mode: 'onChange',
  });

  const { reset, handleSubmit, formState: { isDirty }, watch } = methods;
  const scopeWatched = watch('scope');
  const scopeValue = typeof scopeWatched === 'object' && scopeWatched !== null ? scopeWatched.id : scopeWatched;

  useEffect(() => {
    if (!open) {
      reset({
        scope: SCOPE_OPTIONS[0],
        email: '',
        password: '',
        userName: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        tenantMasterId: null,
        tenantId: null,
        branchId: null,
        role: null,
      });
      setShowPassword(false);
    }
  }, [open, reset]);

  const buildBody = useCallback((data) => {
    const dataScope = typeof data.scope === 'object' && data.scope !== null ? data.scope.id : data.scope;
    const roleValue =
      typeof data.role === 'object' && data.role !== null
        ? data.role.id || data.role.label || data.role
        : data.role;
    const base = {
      email: data.email.trim(),
      password: data.password,
      firstName: data.firstName?.trim() ?? '',
      lastName: data.lastName?.trim() ?? '',
      userName: data.userName?.trim() || undefined,
      phoneNumber: data.phoneNumber?.trim() || undefined,
      role: roleValue ?? undefined,
    };
    if (dataScope === 'tenant-master') {
      const id = typeof data.tenantMasterId === 'object' && data.tenantMasterId !== null ? data.tenantMasterId.id : data.tenantMasterId;
      return { ...base, tenantMasterId: id };
    }
    if (dataScope === 'tenant') {
      const id = typeof data.tenantId === 'object' && data.tenantId !== null ? data.tenantId.id : data.tenantId;
      return { ...base, tenantId: id };
    }
    const id = typeof data.branchId === 'object' && data.branchId !== null ? data.branchId.id : data.branchId;
    return { ...base, branchId: id };
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const submitScope = typeof data.scope === 'object' && data.scope !== null ? data.scope.id : data.scope;
      const body = buildBody(data);
      if (submitScope === 'tenant-master') {
        await registerTenantMasterUser(body).unwrap();
      } else if (submitScope === 'tenant') {
        await registerTenantUser(body).unwrap();
      } else {
        await registerBranchUser(body).unwrap();
      }
      if (onSuccess) onSuccess();
      reset();
      onClose();
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to register user',
        validationMessage: 'Validation failed. Check email and scope selection.',
      });
      toast.error(message, {
        action: isRetryable
          ? {
              label: 'Retry',
              onClick: () => setTimeout(() => onSubmit({ preventDefault: () => {}, target: { checkValidity: () => true } }), 500),
            }
          : undefined,
      });
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

  const handleCancelDiscard = useCallback(() => setUnsavedChangesDialogOpen(false), []);

  const scopeOptionsFiltered = useMemo(() => {
    const list = [];
    if (canRegisterTM) list.push(SCOPE_OPTIONS[0]);
    if (canRegisterTenant) list.push(SCOPE_OPTIONS[1]);
    if (canRegisterBranch) list.push(SCOPE_OPTIONS[2]);
    return list.length ? list : SCOPE_OPTIONS;
  }, [canRegisterTM, canRegisterTenant, canRegisterBranch]);

  return (
    <>
      <CustomDialog
        open={open}
        onClose={handleClose}
        title="Register User"
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        loading={isSubmitting}
        disableClose={isSubmitting}
        actions={
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
              Register
            </Field.Button>
          </Box>
        }
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Scope
              </Typography>
              <Field.Autocomplete
                name="scope"
                label="Register as"
                options={scopeOptionsFiltered}
                getOptionLabel={(opt) => opt?.label ?? opt?.id ?? ''}
                isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
              />
              {scopeValue === 'tenant-master' && (
                <Field.Autocomplete
                  name="tenantMasterId"
                  label="Tenant Master"
                  options={tenantMasterOptions}
                  getOptionLabel={(opt) => opt?.label ?? opt?.id ?? ''}
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  sx={{ mt: 2 }}
                />
              )}
              {scopeValue === 'tenant' && (
                <Field.Autocomplete
                  name="tenantId"
                  label="Tenant"
                  options={tenantOptions}
                  getOptionLabel={(opt) => opt?.label ?? opt?.id ?? ''}
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  sx={{ mt: 2 }}
                />
              )}
              {scopeValue === 'branch' && (
                <Field.Autocomplete
                  name="branchId"
                  label="Branch"
                  options={branchOptions}
                  getOptionLabel={(opt) => opt?.label ?? opt?.id ?? ''}
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                User Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field.Text name="email" label="Email" placeholder="Enter email address" type="email" required />
                <Field.Text
                  name="password"
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
                            <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} width={20} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                  Password must contain at least 6 characters, one digit, one lowercase, and one uppercase letter
                </Typography>
                <Field.Text name="userName" label="User Name" placeholder="Optional" />
                <Field.Text name="firstName" label="First Name" placeholder="Enter first name" required />
                <Field.Text name="lastName" label="Last Name" placeholder="Enter last name" required />
                <Field.Text name="phoneNumber" label="Phone" placeholder="Optional" />
                <Field.Autocomplete
                  name="role"
                  label="Role"
                  placeholder="Select role"
                  options={roleOptions}
                  getOptionLabel={(option) => (option ? option.label || option.id || option : '').toString()}
                  isOptionEqualToValue={(option, value) => (option?.id === value?.id || option === value)}
                />
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
