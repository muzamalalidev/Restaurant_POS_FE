'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { assignRoleToUserSchema } from 'src/schemas';
import { useGetUsersQuery } from 'src/store/api/users-api';
import { useAssignRoleToUserMutation } from 'src/store/api/roles-api';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

/**
 * Assigned Users Tab
 * Assign user flow only (no list of users in role - backend does not provide GET /api/roles/{id}/users).
 * User dropdown + Assign button; duplicate assignment shows backend error.
 */
export function RoleAssignedUsersTab({ role, canAssign }) {
  const isSubmittingRef = useRef(false);

  const { data: usersResponse } = useGetUsersQuery({ pageSize: 200 }, { skip: !role?.id });
  const [assignRoleToUser, { isLoading: isAssigning }] = useAssignRoleToUserMutation();

  const userOptions = useMemo(() => {
    if (!usersResponse?.data) return [];
    return usersResponse.data.map((u) => ({
      id: u.id,
      label: `${u.firstName || ''} ${u.lastName || ''} (${u.email || u.userName || ''})`.trim() || u.id,
    }));
  }, [usersResponse]);

  const methods = useForm({
    resolver: zodResolver(assignRoleToUserSchema),
    defaultValues: { userId: null, roleId: role?.id ?? null },
    mode: 'onChange',
  });

  useEffect(() => {
    if (role?.id) {
      methods.reset({ userId: null, roleId: role.id });
    }
  }, [role?.id, methods]);

  const onSubmit = useCallback(
    async (data) => {
      if (!role?.id || isSubmittingRef.current) return;
      const userId = data.userId?.id ?? data.userId;
      const roleId = data.roleId ?? role.id;
      if (!userId || !roleId) return;
      isSubmittingRef.current = true;
      try {
        await assignRoleToUser({
          userId,
          roleId,
        }).unwrap();
        toast.success('Role assigned to user');
        methods.reset({ userId: null, roleId: role.id });
      } catch (err) {
        const { message, isRetryable } = getApiErrorMessage(err, {
          defaultMessage: 'Failed to assign role to user',
        });
        if (isRetryable) {
          toast.error(message, {
            action: { label: 'Retry', onClick: () => methods.handleSubmit(onSubmit)() },
          });
        } else {
          toast.error(message);
        }
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [role?.id, assignRoleToUser, methods]
  );

  if (!role) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No role selected
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
      <EmptyContent
        title="Assigned users"
        description="Assign this role to a user. Listing users already assigned to this role requires backend support (GET /api/roles/{id}/users)."
        sx={{ py: 3, borderRadius: 1 }}
      />
      {canAssign && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Assign user
          </Typography>
          <Form methods={methods} onSubmit={onSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Field.Autocomplete
                name="userId"
                label="User"
                options={userOptions}
                getOptionLabel={(option) => (option ? (option.label ?? option.id ?? '') : '')}
                isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
                slotProps={{ textField: { placeholder: 'Select user' } }}
              />
              <Field.Button
                type="submit"
                variant="contained"
                startIcon="solar:user-plus-bold"
                loading={isAssigning}
                disabled={isAssigning}
                size="medium"
              >
                Assign
              </Field.Button>
            </Box>
          </Form>
        </Box>
      )}
    </Box>
  );
}
