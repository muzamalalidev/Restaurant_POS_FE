'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useTheme, useMediaQuery } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { registerUserSchema } from 'src/schemas';
import { useRegisterUserMutation } from 'src/store/api/users-api';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * User Register Dialog Component
 *
 * Dialog for registering a new user.
 * Fields: email, password, firstName, lastName, role
 * 
 * Note: Role options are placeholder until roles API is available.
 */
export function UserRegisterDialog({ open, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State for unsaved changes confirmation
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Mutation
  const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();

  const isSubmitting = isRegistering;
  const isSubmittingRef = useRef(false);

  // Role options (placeholder until roles API is available)
  const roleOptions = useMemo(() => [
    { id: 'Admin', label: 'Admin' },
    { id: 'Manager', label: 'Manager' },
    { id: 'Staff', label: 'Staff' },
    { id: 'Cashier', label: 'Cashier' },
  ], []);

  // Form setup
  const methods = useForm({
    resolver: zodResolver(registerUserSchema),
    defaultValues: useMemo(
      () => ({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: null,
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

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      reset({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: null,
      });
      setShowPassword(false);
    }
  }, [open, reset]);

  // Handle form submit (ref guard prevents double-submit)
  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      // Extract role value (could be object from Autocomplete or string)
      const roleValue = typeof data.role === 'object' && data.role !== null
        ? data.role.id || data.role.label || data.role
        : data.role;

      const registerData = {
        email: data.email.trim(),
        password: data.password,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        role: roleValue,
      };

      await registerUser(registerData).unwrap();
      
      if (onSuccess) {
        onSuccess();
      }
      reset();
      onClose();
    } catch (error) {
      const { message, isRetryable } = getApiErrorMessage(error, {
        defaultMessage: 'Failed to register user',
      });
      
      toast.error(message, {
        action: isRetryable ? {
          label: 'Retry',
          onClick: () => {
            // Retry after a short delay
            setTimeout(() => {
              onSubmit();
            }, 500);
          },
        } : undefined,
      });
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
        Register
      </Field.Button>
    </Box>
  );

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
        actions={renderActions()}
      >
        <Form methods={methods} onSubmit={onSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* User Information Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                User Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field.Text
                  name="email"
                  label="Email"
                  placeholder="Enter email address"
                  type="email"
                  required
                />
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
                <Field.Text
                  name="firstName"
                  label="First Name"
                  placeholder="Enter first name"
                  required
                />
                <Field.Text
                  name="lastName"
                  label="Last Name"
                  placeholder="Enter last name"
                  required
                />
                <Field.Autocomplete
                  name="role"
                  label="Role"
                  placeholder="Select role"
                  options={roleOptions}
                  getOptionLabel={(option) => {
                    if (!option) return '';
                    return option.label || option.id || option || '';
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return option === value;
                    return option.id === value.id || option === value;
                  }}
                  required
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                  Note: Role options are placeholder until roles API is available
                </Typography>
              </Box>
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

