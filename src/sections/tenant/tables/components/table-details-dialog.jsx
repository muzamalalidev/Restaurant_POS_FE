'use client';

import { useMemo } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { CustomDialog } from 'src/components/custom-dialog';
import { Field } from 'src/components/hook-form';
import { Label } from 'src/components/label';

import { useGetAllTablesQuery } from 'src/store/api/tables-api';
import {
  getAvailabilityLabel,
  getAvailabilityColor,
  getActiveStatusLabel,
  getActiveStatusColor,
} from '../utils/table-helpers';

// ----------------------------------------------------------------------

/**
 * Helper function to extract ID from object or string
 */
const getId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return value.id;
  }
  return value;
};

// ----------------------------------------------------------------------

/**
 * Table Details Dialog Component
 * 
 * Read-only view of table details.
 * No action buttons - purely informational.
 * 
 * Note: GetById endpoint is a placeholder, so we use getAllTables with branchId filter
 * and client-side filtering by ID to get table data.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {string|null} props.tableId - Table ID
 * @param {string|null} props.branchId - Branch ID (required for fetching table data)
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function TableDetailsDialog({ open, tableId, branchId, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fetch tables (P0-003/P1-003: pageSize 200; getTableById is placeholder - find by ID in response)
  const { data: tablesResponse, isLoading, error: queryError, isError, refetch } = useGetAllTablesQuery(
    {
      branchId: getId(branchId),
      pageSize: 200,
    },
    {
      skip: !tableId || !branchId || !open,
    }
  );

  // Find the table by ID from the response
  const table = useMemo(() => {
    if (!tablesResponse || !tableId) return null;
    const tables = tablesResponse.data || [];
    return tables.find((t) => t.id === tableId) || null;
  }, [tablesResponse, tableId]);

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Table Details"
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      loading={isLoading}
    >
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Loading table details...
          </Typography>
        </Box>
      ) : isError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 200, gap: 2 }}>
          <Typography variant="body1" color="error">
            Failed to load table details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {queryError?.data?.message || queryError?.message || 'Network Error'}
          </Typography>
          <Field.Button variant="contained" onClick={() => refetch()} startIcon="solar:refresh-bold" sx={{ mt: 1 }}>
            Retry
          </Field.Button>
        </Box>
      ) : table ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Table Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Table Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Table Number
                </Typography>
                <Typography variant="body1">{table.tableNumber}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Branch
                </Typography>
                <Typography variant="body1">{table.branchName || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Capacity
                </Typography>
                <Typography variant="body1">{table.capacity}</Typography>
              </Box>
              {table.location && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">{table.location}</Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Status */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Status
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Available
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={getAvailabilityColor(table.isAvailable)} variant="soft">
                    {getAvailabilityLabel(table.isAvailable)}
                  </Label>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Active
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={getActiveStatusColor(table.isActive)} variant="soft">
                    {getActiveStatusLabel(table.isActive)}
                  </Label>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <Typography variant="body2" color="text.secondary">
            Table not found
          </Typography>
        </Box>
      )}
    </CustomDialog>
  );
}

