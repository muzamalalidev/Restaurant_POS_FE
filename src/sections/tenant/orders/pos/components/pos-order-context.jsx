'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

/**
 * Order context: branch, order type, table, staff, payment mode.
 * Compact for POS right pane. All from Form context.
 */
export function PosOrderContext({
  branchOptions = [],
  orderTypeOptions = [],
  tableOptions = [],
  staffOptions = [],
  paymentModeOptions = [],
  branchSelected,
  showTableField = true,
}) {
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" color="text.secondary">
        Order context
      </Typography>
      <Field.Autocomplete
        name="branchId"
        label="Branch"
        options={branchOptions}
        getOptionLabel={(opt) => (opt?.label ?? opt?.name ?? opt?.id ?? '')}
        isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
        required
        slotProps={{
          textField: {
            size: 'small',
          },
        }}
      />
      <Field.Autocomplete
        name="orderTypeId"
        label="Order type"
        options={orderTypeOptions}
        getOptionLabel={(opt) => (opt?.label ?? opt?.name ?? opt?.id ?? '')}
        isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
        required
        slotProps={{
          textField: {
            size: 'small',
          },
        }}
      />
      {showTableField && (
        <Field.Autocomplete
          name="tableId"
          label="Table"
          options={tableOptions}
          getOptionLabel={(opt) => (opt?.label ?? opt?.name ?? opt?.id ?? '')}
          isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
          disabled={!branchSelected}
          slotProps={{
            textField: {
              size: 'small',
            },
          }}
        />
      )}
      <Field.Autocomplete
        name="staffId"
        label="Staff"
        options={staffOptions}
        getOptionLabel={(opt) => (opt?.label ?? opt?.name ?? opt?.id ?? '')}
        isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
        slotProps={{
          textField: {
            size: 'small',
          },
        }}
      />
      {paymentModeOptions.length > 0 && (
        <Field.Autocomplete
          name="paymentModeId"
          label="Payment mode"
          options={paymentModeOptions}
          getOptionLabel={(opt) => (opt?.label ?? opt?.name ?? opt?.id ?? '')}
          isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
          slotProps={{
            textField: {
              size: 'small',
            },
          }}
        />
      )}
    </Stack>
  );
}
