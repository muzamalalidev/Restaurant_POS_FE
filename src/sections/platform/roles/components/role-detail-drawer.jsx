'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useGetRoleByIdQuery } from 'src/store/api/roles-api';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';
import { QueryStateContent } from 'src/components/query-state-content';

import { RoleOverviewTab } from './role-overview-tab';
import { RolePermissionsTab } from './role-permissions-tab';
import { RoleAssignedUsersTab } from './role-assigned-users-tab';

// ----------------------------------------------------------------------

const DRAWER_WIDTH = 440;
const TAB_VALUES = { overview: 'overview', permissions: 'permissions', assignedUsers: 'assignedUsers' };

// ----------------------------------------------------------------------

/**
 * Role Detail Drawer
 * Tabs: Overview, Permissions, Assigned Users.
 * Uses getRoleById when open; QueryStateContent for loading/error/empty.
 */
export function RoleDetailDrawer({
  open,
  selectedRoleId,
  onClose,
  canUpdate,
  canAssign,
}) {
  const [activeTab, setActiveTab] = useState(TAB_VALUES.overview);

  const {
    data: role,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetRoleByIdQuery(selectedRoleId, {
    skip: !open || !selectedRoleId,
  });

  const isEmpty = !isLoading && !isError && open && selectedRoleId && !role;

  const handleClose = useCallback(() => {
    setActiveTab(TAB_VALUES.overview);
    onClose();
  }, [onClose]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <QueryStateContent isLoading minHeight={280}>
          {null}
        </QueryStateContent>
      );
    }
    if (isError) {
      return (
        <QueryStateContent
          isError
          error={error}
          onRetry={refetch}
          errorMessageOptions={{ notFoundMessage: 'Role not found' }}
          minHeight={280}
        >
          {null}
        </QueryStateContent>
      );
    }
    if (isEmpty) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 280,
            gap: 2,
            p: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Role not found. It may have been deleted.
          </Typography>
          <Field.Button variant="outlined" onClick={handleClose} size="medium">
            Close
          </Field.Button>
        </Box>
      );
    }
    if (!role) return null;
    return (
      <>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            variant="fullWidth"
            sx={{ minHeight: 48 }}
          >
            <Tab label="Overview" value={TAB_VALUES.overview} />
            <Tab label="Permissions" value={TAB_VALUES.permissions} />
            <Tab label="Assigned Users" value={TAB_VALUES.assignedUsers} />
          </Tabs>
        </Box>
        <Box sx={{ overflow: 'auto', flex: 1, px: 2, py: 2 }}>
          {activeTab === TAB_VALUES.overview && (
            <RoleOverviewTab role={role} />
          )}
          {activeTab === TAB_VALUES.permissions && (
            <RolePermissionsTab role={role} canUpdate={canUpdate} />
          )}
          {activeTab === TAB_VALUES.assignedUsers && (
            <RoleAssignedUsersTab role={role} canAssign={canAssign} />
          )}
        </Box>
      </>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{
        backdrop: { invisible: false },
      }}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box
        sx={{
          py: 2,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">
          {role?.name ?? 'Role details'}
        </Typography>
        <IconButton onClick={handleClose} aria-label="Close drawer" edge="end">
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {renderContent()}
      </Box>
    </Drawer>
  );
}
