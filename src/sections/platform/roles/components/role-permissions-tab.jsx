'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { getApiErrorMessage } from 'src/utils/api-error-message';

import { useUpdateRoleMutation, useGetPermissionsQuery } from 'src/store/api/roles-api';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

/**
 * Group permissions by ControllerName; each group has select-all and per-permission checkbox.
 * Save sends PUT update with full permissionIds (replaces all).
 */
function groupPermissionsByController(permissions) {
  if (!Array.isArray(permissions)) return [];
  const byController = {};
  for (const p of permissions) {
    const controller = p.controllerName ?? p.ControllerName ?? 'Other';
    if (!byController[controller]) byController[controller] = [];
    byController[controller].push(p);
  }
  return Object.entries(byController).map(([name, items]) => ({ controllerName: name, items }));
}

// ----------------------------------------------------------------------

export function RolePermissionsTab({ role, canUpdate }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(role?.permissionIds ?? []));
  const isSubmittingRef = useRef(false);

  const searchForm = useForm({ defaultValues: { searchQuery: '' } });
  const searchQuery = searchForm.watch('searchQuery') ?? '';

  const { data: permissionsList, isLoading: isLoadingPermissions } = useGetPermissionsQuery(undefined, {
    skip: !role?.id,
  });
  const [updateRole, { isLoading: isSaving }] = useUpdateRoleMutation();

  const permissions = useMemo(() => permissionsList ?? [], [permissionsList]);
  const groups = useMemo(() => groupPermissionsByController(permissions), [permissions]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q === '') return groups;
    return groups
      .map((g) => ({
        controllerName: g.controllerName,
        items: g.items.filter((p) => {
          const controller = (g.controllerName ?? '').toLowerCase();
          const name = (p.name ?? p.Name ?? '').toLowerCase();
          const code = (p.code ?? p.Code ?? '').toLowerCase();
          return controller.includes(q) || name.includes(q) || code.includes(q);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, searchQuery]);

  useEffect(() => {
    const ids = role?.permissionIds ?? [];
    setSelectedIds(new Set(Array.isArray(ids) ? ids : []));
  }, [role?.id, role?.permissionIds]);

  const handleToggleOne = useCallback((permissionId, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permissionId);
      else next.delete(permissionId);
      return next;
    });
  }, []);

  const handleToggleGroup = useCallback((groupItems, checked) => {
    const ids = groupItems.map((p) => p.id ?? p.Id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!role?.id || !canUpdate) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await updateRole({
        id: role.id,
        name: role.name,
        scope: role.scope,
        isActive: role.isActive,
        permissionIds: Array.from(selectedIds),
      }).unwrap();
      toast.success('Permissions updated');
    } catch (err) {
      const { message, isRetryable } = getApiErrorMessage(err, {
        defaultMessage: 'Failed to update permissions',
      });
      if (isRetryable) {
        toast.error(message, { action: { label: 'Retry', onClick: () => handleSave() } });
      } else {
        toast.error(message);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }, [role, selectedIds, canUpdate, updateRole]);

  if (!role) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No role selected
        </Typography>
      </Box>
    );
  }

  if (isLoadingPermissions) {
    return (
      <Box sx={{ py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Loading permissions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
      {/* Sticky bar: full-width background so scrolling list does not show through */}
      <Box
        sx={(theme) => ({
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 1.5,
          pb: 2,
          marginLeft: theme.spacing(-2),
          marginRight: theme.spacing(-2),
          px: 2,
          backgroundColor: theme.palette.background.paper,
          borderBottom: 1,
          borderColor: 'divider',
          marginBottom: 1,
        })}
      >
        <FormProvider {...searchForm}>
          <Field.Text
            name="searchQuery"
            placeholder="Search permissions..."
            size="small"
            aria-label="Search permissions"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => searchForm.setValue('searchQuery', '')}
                      aria-label="Clear search"
                      edge="end"
                    >
                      <Iconify icon="eva:close-fill" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{ flex: 1, minWidth: 0 }}
          />
        </FormProvider>
        {canUpdate && groups.length > 0 && (
          <Field.Button
            variant="contained"
            startIcon="solar:check-circle-bold"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            size="medium"
          >
            Save permissions
          </Field.Button>
        )}
      </Box>

      {filteredGroups.length === 0 && searchQuery.trim() !== '' && (
        <Typography variant="body2" color="text.secondary">
          No permissions match your search.
        </Typography>
      )}

      {filteredGroups.length === 0 && searchQuery.trim() === '' && (
        <Typography variant="body2" color="text.secondary">
          No permissions available
        </Typography>
      )}

      {filteredGroups.map(({ controllerName, items }) => {
        const itemIds = items.map((p) => p.id ?? p.Id);
        const selectedCount = itemIds.filter((id) => selectedIds.has(id)).length;
        const allSelected = selectedCount === itemIds.length;
        const someSelected = selectedCount > 0;
        return (
          <Box key={controllerName}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={(e) => handleToggleGroup(items, e.target.checked)}
                  disabled={!canUpdate}
                />
              }
              label={
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {controllerName}
                </Typography>
              }
            />
            <FormGroup sx={{ pl: 3, mt: 0.5 }}>
              {items.map((p) => {
                const id = p.id ?? p.Id;
                const code = p.code ?? p.Code ?? id;
                const name = p.name ?? p.Name ?? code;
                return (
                  <FormControlLabel
                    key={id}
                    control={
                      <Checkbox
                        checked={selectedIds.has(id)}
                        onChange={(e) => handleToggleOne(id, e.target.checked)}
                        disabled={!canUpdate}
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.secondary">
                        {name}
                      </Typography>
                    }
                  />
                );
              })}
            </FormGroup>
          </Box>
        );
      })}
    </Box>
  );
}
