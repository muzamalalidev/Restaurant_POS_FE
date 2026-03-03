'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { createRoleSchema, updateRoleSchema } from 'src/schemas';
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useGetRoleScopesDropdownQuery,
} from 'src/store/api/roles-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { CustomDialog } from 'src/components/custom-dialog';
import { ConfirmDialog } from 'src/components/custom-dialog/confirm-dialog';

// ----------------------------------------------------------------------

/**
 * Role Form Dialog
 * Single dialog for create and edit. Create returns 201 with GUID in body.
 * Scope options from scopes-dropdown (allowed for current user).
 */
export function RoleFormDialog({ open, mode, record, onClose, onSuccess }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  const isSubmitting = isCreating || isUpdating;
  const isSubmittingRef = useRef(false);
  const schema = mode === 'create' ? createRoleSchema : updateRoleSchema;

  const { data: scopesDropdown } = useGetRoleScopesDropdownQuery(undefined, { skip: !open });

  const scopeOptions = useMemo(() => {
    if (!scopesDropdown || !Array.isArray(scopesDropdown)) return [];
    return scopesDropdown.map((d) => {
      const key = d.key ?? d.Key;
      const num = typeof key === 'string' ? Number(key) : key;
      return {
        id: Number.isNaN(num) ? key : num,
        label: d.value ?? d.Value ?? String(key),
      };
    });
  }, [scopesDropdown]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({
        name: '',
        scope: null,
        isActive: true,
      }),
      []
    ),
    mode: 'onChange',
  });

  const { reset, handleSubmit, formState: { isDirty } } = methods;

  useEffect(() => {
    if (!open) {
      reset({ name: '', scope: null, isActive: true });
      return;
    }
    if (mode === 'edit' && record) {
      const scopeOption = scopeOptions.find((o) => o.id === record.scope) ?? {
        id: record.scope,
        label: String(record.scope),
      };
      reset({
        name: record.name ?? '',
        scope: record.scope != null ? scopeOption : null,
        isActive: record.isActive ?? true,
      });
    } else {
      reset({ name: '', scope: null, isActive: true });
    }
  }, [open, mode, record, reset, scopeOptions]);

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      const scopeValue = data.scope?.id ?? data.scope;
      if (mode === 'create') {
        const createData = {
          name: data.name.trim(),
          scope: scopeValue,
          isActive: data.isActive,
        };
        const result = await createRole(createData).unwrap();
        const id = result?.id ?? result;
        if (onSuccess) onSuccess(id, 'created');
      } else {
        const updateData = {
          name: data.name.trim(),
          scope: scopeValue,
          isActive: data.isActive,
        };
        await updateRole({ id: record.id, ...updateData }).unwrap();
        if (onSuccess) onSuccess(record.id, 'updated');
      }
      reset();
      onClose();
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: `Failed to ${mode === 'create' ? 'create' : 'update'} role`,
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
        title={mode === 'create' ? 'Create Role' : 'Edit Role'}
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
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Role details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Field.Text
                  name="name"
                  label="Name"
                  placeholder="Enter role name"
                  required
                  inputProps={{ maxLength: 256 }}
                  characterCounter
                />
                <Field.Autocomplete
                  name="scope"
                  label="Scope"
                  options={scopeOptions}
                  getOptionLabel={(option) => (option ? (option.label ?? String(option.id ?? '')) : '')}
                  isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
                  slotProps={{
                    textField: {
                      placeholder: 'Select scope',
                      required: true,
                    },
                  }}
                />
                <Field.Switch name="isActive" label="Active" />
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
