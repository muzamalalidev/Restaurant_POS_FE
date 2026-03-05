'use client';

import Stack from '@mui/material/Stack';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

/**
 * Order context: order type, table, staff, payment mode.
 * Compact for POS right pane. All from Form context. Branch comes from route/context.
 */
export function PosOrderContext({
  orderTypeOptions = [],
  orderTypeOptionsLoading = false,
  tableOptions = [],
  staffOptions = [],
  paymentModeOptions = [],
  showTableField = true,
}) {
  return (
    <Stack spacing={2}>
    <Stack direction="column" spacing={0.5}>
        <Field.ChipStrip
          name="orderTypeId"
          categories={orderTypeOptions}
          loading={orderTypeOptionsLoading}
          getOptionLabel={(opt) => (opt?.label ?? opt?.name ?? String(opt?.id ?? opt ?? ''))}
          getOptionId={(opt) => opt?.id ?? opt}
          showAllOption={false}
          required
        />
      </Stack>
      {showTableField && (
        <Field.Autocomplete
          name="tableId"
          label="Table"
          options={tableOptions}
          getOptionLabel={(opt) => (opt?.label ?? opt?.name ?? opt?.id ?? '')}
          isOptionEqualToValue={(a, b) => (a?.id ?? a) === (b?.id ?? b)}
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
