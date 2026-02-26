'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { useGetAllTablesQuery } from 'src/store/api/tables-api';

import { Label } from 'src/components/label';
import { CustomDialog } from 'src/components/custom-dialog';
import { QueryStateContent } from 'src/components/query-state-content';

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
      <QueryStateContent
        isLoading={isLoading}
        isError={isError}
        error={queryError}
        onRetry={refetch}
        loadingMessage="Loading table details..."
        errorTitle="Failed to load table details"
        errorMessageOptions={{
          defaultMessage: 'Failed to load table details',
          notFoundMessage: 'Table not found',
        }}
        isEmpty={!table && !isLoading && !isError}
        emptyMessage="Table not found"
      >
        {table ? (
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
        ) : null}
      </QueryStateContent>
    </CustomDialog>
  );
}

