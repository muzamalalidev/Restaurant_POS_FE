'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { Label } from 'src/components/label';
import { CustomTable } from 'src/components/custom-table';
import { CustomDialog } from 'src/components/custom-dialog';

import { formatTimeMinutes, getActiveStatusColor, getActiveStatusLabel } from '../utils/recipe-helpers';

// ----------------------------------------------------------------------

/**
 * Recipe Details Dialog Component
 *
 * Read-only view of recipe details. Uses the full row object passed from the list
 * (no getById or extra API call).
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object|null} props.record - Full recipe object from list
 * @param {Function} props.onClose - Callback when dialog closes
 */
export function RecipeDetailsDialog({ open, record, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Recipe Details"
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      {record ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, pb: 3 }}>
          {/* Recipe Information */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Recipe Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{record.name}</Typography>
              </Box>
              {record.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {record.description}
                  </Typography>
                </Box>
              )}
              {record.instructions && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Instructions
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {record.instructions}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Recipe Details */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Recipe Details
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Servings
                </Typography>
                <Typography variant="body1">{record.servings}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Preparation Time
                </Typography>
                <Typography variant="body1">{formatTimeMinutes(record.preparationTimeMinutes)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Cooking Time
                </Typography>
                <Typography variant="body1">{formatTimeMinutes(record.cookingTimeMinutes)}</Typography>
              </Box>
            </Stack>
          </Box>

          <Divider />

          {/* Ingredients */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Ingredients ({record.ingredients?.length || 0})
            </Typography>
            {record.ingredients && record.ingredients.length > 0 ? (
              <CustomTable
                rows={record.ingredients.map((ingredient, index) => ({
                  id: index,
                  itemName: ingredient.itemName || '-',
                  quantity: ingredient.quantity ?? '0',
                  notes: ingredient.notes || '-',
                }))}
                columns={[
                  {
                    field: 'itemName',
                    headerName: 'Item Name',
                    flex: 2,
                  },
                  {
                    field: 'quantity',
                    headerName: 'Quantity',
                    flex: 1,
                    renderCell: (params) => (
                      <Typography variant="body2" align="right" sx={{ width: '100%', textAlign: 'right' }}>
                        {params.value}
                      </Typography>
                    ),
                  },
                  {
                    field: 'notes',
                    headerName: 'Notes',
                    flex: 2,
                  },
                ]}
                pagination={false}
                toolbar={false}
                hideFooter
                getRowId={(row) => row.id}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No ingredients added to this recipe.
              </Typography>
            )}
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
                  Active
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Label color={getActiveStatusColor(record.isActive)} variant="soft">
                    {getActiveStatusLabel(record.isActive)}
                  </Label>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      ) : null}
    </CustomDialog>
  );
}
