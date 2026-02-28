import dayjs from 'dayjs';
import { MuiOtpInput } from 'mui-one-time-password-input';
import { Controller, useFormContext } from 'react-hook-form';
import { lazy, useRef, Suspense, useState, useEffect } from 'react';
import { transformValue, transformValueOnBlur, transformValueOnChange } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Radio from '@mui/material/Radio';
import Switch from '@mui/material/Switch';
import Rating from '@mui/material/Rating';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import { inputBaseClasses } from '@mui/material/InputBase';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { getApiErrorMessage } from 'src/utils/api-error-message';
import { uploadFileViaPresigned } from 'src/utils/s3-upload-service';

import {
  useDirectUploadMutation,
  useLazyGetPresignedUrlsQuery,
  useLazyGetPresignedDownloadUrlQuery,
} from 'src/store/api/s3-upload-api';

import { toast } from 'src/components/snackbar';

import { Iconify } from '../iconify';
import { HelperText } from './help-text';
import { PhoneInput } from '../phone-input';
import { NumberInput } from '../number-input';
import { CountrySelect } from '../country-select';
import { Upload, UploadBox, UploadAvatar } from '../upload';

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

/**
 * Normalizes date values from various formats (dayjs, string, timestamp, null)
 * @param {any} value - The date value to normalize
 * @returns {dayjs.Dayjs|null} - Normalized dayjs object or null
 */
function normalizeDateValue(value) {
  if (dayjs.isDayjs(value)) return value;

  const parsed = value ? dayjs(value) : null;
  return parsed?.isValid() ? parsed : null;
}

/**
 * Generates a unique field ID for accessibility
 * @param {string} name - Field name
 * @param {string} suffix - Optional suffix for the ID
 * @returns {string} - Unique field ID
 */
function generateFieldId(name, suffix = '') {
  return `${name}${suffix ? `-${suffix}` : ''}`;
}

/**
 * Ensures multi-select value is always an array
 * @param {any} value - The value to normalize
 * @returns {Array} - Array value (empty array if null/undefined)
 */
function handleMultiSelectValue(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

/**
 * Prevents leading spaces in input values
 * Removes leading whitespace while allowing spaces after characters
 * @param {string} newValue - The new input value
 * @param {string} previousValue - The previous value (default: '')
 * @returns {string} - Value with leading spaces removed
 */
function preventLeadingSpaces(newValue, previousValue = '') {
  if (!newValue || typeof newValue !== 'string') return newValue;

  // Remove all leading whitespace characters
  const trimmed = newValue.replace(/^\s+/, '');

  // If value was empty and user tried to add leading space, return empty
  if (!previousValue && newValue.startsWith(' ')) {
    return '';
  }

  return trimmed;
}

/** Sx applied when a field is disabled: no-drop cursor and grey background */
const disabledFieldSx = { cursor: 'no-drop', backgroundColor: 'grey.200' };

/**
 * Clamps a numeric value to [min, max] when min/max are provided.
 * Returns the original value if empty or not a number; otherwise returns clamped number.
 */
function clampNumberValue(value, min, max) {
  if (value === '' || value === null || value === undefined) return value;
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  const minNum = min != null && min !== '' ? Number(min) : null;
  const maxNum = max != null && max !== '' ? Number(max) : null;
  let result = num;
  if (minNum != null) result = Math.max(minNum, result);
  if (maxNum != null) result = Math.min(maxNum, result);
  return result;
}

// ----------------------------------------------------------------------
// TextField Component
// ----------------------------------------------------------------------

/**
 * React Hook Form TextField component
 * Handles text, number, email, password, and other input types
 * @param {string} name - Field name (required)
 * @param {string} type - Input type (default: 'text')
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} other - Additional props passed to TextField
 */
export function RHFTextField({ name, helperText, slotProps, type = 'text', ...other }) {
  const { control } = useFormContext();

  const isNumberType = type === 'number';
  const isMultiline = other.multiline || other.rows || other.rowsMax || other.rowsMin;
  const inputMin = slotProps?.input?.inputProps?.min;
  const inputMax = slotProps?.input?.inputProps?.max;
  const hasMinMax = isNumberType && (inputMin != null || inputMax != null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          value={
            isNumberType
              ? (field.value === null || field.value === undefined
                  ? ''
                  : transformValue(field.value))
              : field.value ?? ''
          }
          onChange={(event) => {
            let transformedValue = event.target.value;

            if (isNumberType) {
              // Number type handling (existing)
              transformedValue = transformValueOnChange(transformedValue);
              if (hasMinMax) {
                transformedValue = clampNumberValue(transformedValue, inputMin, inputMax);
              }
            } else {
              // Prevent leading spaces for text inputs
              // For multiline, only prevent on first line
              if (isMultiline) {
                // Split by newlines, prevent leading spaces on first line only
                const lines = transformedValue.split('\n');
                if (lines.length > 0 && lines[0]) {
                  lines[0] = preventLeadingSpaces(lines[0], field.value?.split('\n')[0] || '');
                }
                transformedValue = lines.join('\n');
              } else {
                transformedValue = preventLeadingSpaces(transformedValue, field.value || '');
              }
            }

            field.onChange(transformedValue);
          }}
          onBlur={(event) => {
            let transformedValue = event.target.value;

            if (isNumberType) {
              transformedValue = transformValueOnBlur(transformedValue);
              if (hasMinMax) {
                transformedValue = clampNumberValue(transformedValue, inputMin, inputMax);
              }
            } else {
              // Also prevent leading spaces on blur (handles paste operations)
              if (isMultiline) {
                const lines = transformedValue.split('\n');
                if (lines.length > 0 && lines[0]) {
                  lines[0] = preventLeadingSpaces(lines[0], '');
                }
                transformedValue = lines.join('\n');
              } else {
                transformedValue = preventLeadingSpaces(transformedValue, '');
              }
            }

            field.onChange(transformedValue);
          }}
          type={isNumberType ? 'text' : type}
          error={!!error}
          helperText={error?.message ?? helperText}
          slotProps={{
            ...slotProps,
            input: {
              ...slotProps?.input,
              sx: [
                ...(Array.isArray(slotProps?.input?.sx) ? slotProps.input.sx : [slotProps?.input?.sx].filter(Boolean)),
                ...(other.disabled ? [disabledFieldSx] : []),
              ],
            },
            htmlInput: {
              ...slotProps?.htmlInput,
              ...(isNumberType && {
                inputMode: 'decimal',
                pattern: '[0-9]*\\.?[0-9]*',
              }),
              autoComplete: 'new-password', // Disable autocomplete and autofill
            },
          }}
          {...other}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------
// PhoneInput Component
// ----------------------------------------------------------------------

/**
 * React Hook Form PhoneInput component
 * Handles international phone number input with country selection
 * @param {string} name - Field name (required)
 * @param {ReactNode} helperText - Helper text to display
 * @param {string} country - Locked country code
 * @param {string} defaultCountry - Default country code (defaults to 'PK' for Pakistan)
 * @param {object} other - Additional props passed to PhoneInput
 */
export function RHFPhoneInput({ name, helperText, country, defaultCountry = 'PK', ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <PhoneInput
          {...field}
          fullWidth
          country={country}
          defaultCountry={defaultCountry}
          error={!!error}
          helperText={error?.message ?? helperText}
          sx={[
            ...(Array.isArray(other.sx) ? other.sx : [other.sx].filter(Boolean)),
            ...(other.disabled ? [disabledFieldSx] : []),
          ]}
          {...other}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------
// DatePicker Components
// ----------------------------------------------------------------------

/**
 * React Hook Form DatePicker component
 * Handles date selection with dayjs normalization
 * @param {string} name - Field name (required)
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} other - Additional props passed to DatePicker
 */
export function RHFDatePicker({ name, slotProps, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DatePicker
          {...field}
          value={normalizeDateValue(field.value)}
          onChange={(newValue) => {
            if (!newValue) {
              field.onChange(null);
              return;
            }

            const parsedValue = dayjs(newValue);
            field.onChange(parsedValue.isValid() ? parsedValue.format() : newValue);
          }}
          slotProps={{
            ...slotProps,
            textField: {
              ...slotProps?.textField,
              error: !!error,
              helperText: error?.message ?? slotProps?.textField?.helperText,
              ...(other.disabled && { sx: disabledFieldSx }),
            },
          }}
          {...other}
        />
      )}
    />
  );
}

/**
 * React Hook Form TimePicker component
 * Handles time selection with dayjs normalization
 * @param {string} name - Field name (required)
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} other - Additional props passed to TimePicker
 */
export function RHFTimePicker({ name, slotProps, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TimePicker
          {...field}
          value={normalizeDateValue(field.value)}
          onChange={(newValue) => {
            if (!newValue) {
              field.onChange(null);
              return;
            }

            const parsedValue = dayjs(newValue);
            field.onChange(parsedValue.isValid() ? parsedValue.format() : newValue);
          }}
          slotProps={{
            ...slotProps,
            textField: {
              ...slotProps?.textField,
              error: !!error,
              helperText: error?.message ?? slotProps?.textField?.helperText,
              ...(other.disabled && { sx: disabledFieldSx }),
            },
          }}
          {...other}
        />
      )}
    />
  );
}

/**
 * React Hook Form DateTimePicker component
 * Handles date and time selection with dayjs normalization
 * @param {string} name - Field name (required)
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} other - Additional props passed to DateTimePicker
 */
export function RHFDateTimePicker({ name, slotProps, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <DateTimePicker
          {...field}
          value={normalizeDateValue(field.value)}
          onChange={(newValue) => {
            if (!newValue) {
              field.onChange(null);
              return;
            }

            const parsedValue = dayjs(newValue);
            field.onChange(parsedValue.isValid() ? parsedValue.format() : newValue);
          }}
          slotProps={{
            ...slotProps,
            textField: {
              ...slotProps?.textField,
              error: !!error,
              helperText: error?.message ?? slotProps?.textField?.helperText,
              ...(other.disabled && { sx: disabledFieldSx }),
            },
          }}
          {...other}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------
// MultiSelect Component
// ----------------------------------------------------------------------

/**
 * React Hook Form MultiSelect component
 * Handles multiple selection with Autocomplete, search, and clear icon
 * @param {string} name - Field name (required)
 * @param {boolean} chip - Display selected items as chips (default: true)
 * @param {string} label - Field label
 * @param {Array} options - Array of {value, label} objects
 * @param {boolean} checkbox - Show checkboxes in dropdown
 * @param {string} placeholder - Placeholder text when empty
 * @param {object} slotProps - MUI slot props for customization
 * @param {ReactNode} helperText - Helper text to display
 * @param {function} filterOptions - Custom filter function (optional)
 * @param {function} getOptionLabel - Custom label getter (optional)
 * @param {number} limitTags - Limit number of chips displayed
 * @param {boolean} fullWidth - Full width component (default: true)
 * @param {object} other - Additional props passed to Autocomplete
 */
export function RHFMultiSelect({
  name,
  chip = true,
  label,
  options = [],
  checkbox,
  placeholder,
  slotProps,
  helperText,
  filterOptions: filterOptionsProp,
  getOptionLabel: getOptionLabelProp,
  limitTags,
  fullWidth = true,
  ...other
}) {
  const { control, setValue } = useFormContext();

  const labelId = generateFieldId(name, 'multi-select');

  // Default filter function - case-insensitive search by label
  const defaultFilterOptions = (optionsToFilter, { inputValue }) => {
    if (!inputValue) return optionsToFilter;
    const searchLower = inputValue.toLowerCase();
    return optionsToFilter.filter((option) =>
      option.label?.toLowerCase().includes(searchLower)
    );
  };

  // Default getOptionLabel - extract label from option object
  const defaultGetOptionLabel = (option) => {
    if (typeof option === 'string') return option;
    return option?.label ?? '';
  };

  // Default isOptionEqualToValue - compare by value property
  const isOptionEqualToValue = (option, value) => {
    if (!option || !value) return false;
    return option.value === value.value;
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const fieldValue = handleMultiSelectValue(field.value);

        // Get selected option objects from values
        const selectedOptions = options.filter((option) =>
          fieldValue.includes(option.value)
        );

        // Handle input change with leading space prevention
        const handleInputChange = (event, value, reason) => {
          // Only prevent leading spaces when user is typing (not when selecting from options)
          if (reason === 'input' && typeof value === 'string') {
            const cleanedValue = preventLeadingSpaces(value, '');
            // If value was cleaned, update it
            if (cleanedValue !== value && event?.target) {
              event.target.value = cleanedValue;
            }
          }
        };

        return (
          <Autocomplete
            {...field}
            multiple
            fullWidth={fullWidth}
            id={labelId}
            options={options}
            value={selectedOptions}
            onChange={(event, newValue) => {
              const values = newValue.map((option) => option.value);
              setValue(name, values, { shouldValidate: true });
            }}
            onInputChange={handleInputChange}
            filterOptions={filterOptionsProp || defaultFilterOptions}
            getOptionLabel={getOptionLabelProp || defaultGetOptionLabel}
            isOptionEqualToValue={isOptionEqualToValue}
            disableCloseOnSelect
            limitTags={limitTags}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                error={!!error}
                helperText={error?.message ?? helperText}
                slotProps={{
                  ...slotProps?.textField?.slotProps,
                  htmlInput: {
                    ...params.inputProps,
                    ...slotProps?.textField?.slotProps?.htmlInput,
                    id: labelId,
                    autoComplete: 'new-password', // Disable autocomplete and autofill
                  },
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    ...slotProps?.textField?.slotProps?.input,
                    ...(other.disabled && {
                      sx: [
                        ...(Array.isArray(slotProps?.textField?.slotProps?.input?.sx)
                          ? slotProps.textField.slotProps.input.sx
                          : [slotProps?.textField?.slotProps?.input?.sx].filter(Boolean)),
                        disabledFieldSx,
                      ],
                    }),
                  },
                  ...slotProps?.textField?.slotProps,
                }}
                {...slotProps?.textField}
              />
            )}
            renderOption={(props, option, state) => {
              const { key, ...otherProps } = props;
              const isSelected = fieldValue.includes(option.value);

              return (
                <li key={key} {...otherProps}>
                  {checkbox && (
                    <Checkbox
                      size="small"
                      disableRipple
                      checked={isSelected}
                      slotProps={{
                        input: {
                          id: `${labelId}-option-${option.value}`,
                          'aria-label': `${option.label} checkbox`,
                        },
                      }}
                      {...slotProps?.checkbox}
                    />
                  )}
                  {option.label}
                </li>
              );
            }}
            renderTags={(value, getTagProps) => {
              if (!chip) {
                // If chip is false, show comma-separated text in a single element
                const text = value.map((option) => option.label).join(', ');
                return (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-block',
                      color: 'text.primary',
                      typography: 'body2',
                    }}
                  >
                    {text}
                  </Box>
                );
              }

              // Render chips
              return value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.value}
                  size="small"
                  variant="soft"
                  label={option.label}
                  {...slotProps?.chip}
                />
              ));
            }}
            slotProps={{
              ...slotProps?.autocomplete,
              paper: {
                ...slotProps?.autocomplete?.paper,
                sx: [
                  { maxHeight: 220 },
                  ...(Array.isArray(slotProps?.autocomplete?.paper?.sx)
                    ? slotProps.autocomplete.paper.sx
                    : [slotProps?.autocomplete?.paper?.sx]),
                ],
              },
            }}
            {...other}
          />
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------
// Autocomplete Component
// ----------------------------------------------------------------------

/**
 * React Hook Form Autocomplete component
 * Handles autocomplete input with search functionality
 * @param {string} name - Field name (required)
 * @param {string} label - Field label
 * @param {object} slotProps - MUI slot props for customization
 * @param {ReactNode} helperText - Helper text to display
 * @param {string} placeholder - Placeholder text
 * @param {object} other - Additional props passed to Autocomplete
 */
export function RHFAutocomplete({ name, label, slotProps, helperText, placeholder, ...other }) {
  const { control, setValue } = useFormContext();

  const { textField, ...otherSlotProps } = slotProps ?? {};

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Handle input change with leading space prevention
        const handleInputChange = (event, value, reason) => {
          // Only prevent leading spaces when user is typing (not when selecting from options)
          if (reason === 'input' && typeof value === 'string') {
            const previousValue = typeof field.value === 'string' ? field.value : '';
            const cleanedValue = preventLeadingSpaces(value, previousValue);
            
            // If value was cleaned (leading spaces removed), update it
            if (cleanedValue !== value) {
              setValue(name, cleanedValue, { shouldValidate: true });
              // Update the input element directly to reflect the change immediately
              if (event?.target) {
                event.target.value = cleanedValue;
              }
              return;
            }
          }
          
          // For option selection, update normally
          if (reason !== 'input') {
            setValue(name, value, { shouldValidate: true });
          }
        };

        return (
          <Autocomplete
            {...field}
            id={generateFieldId(name, 'rhf-autocomplete')}
            onChange={(event, newValue) => setValue(name, newValue, { shouldValidate: true })}
            onInputChange={handleInputChange}
            renderInput={(params) => (
              <TextField
                {...params}
                {...textField}
                label={label}
                placeholder={placeholder}
                error={!!error}
                helperText={error?.message ?? helperText}
                slotProps={{
                  ...textField?.slotProps,
                  htmlInput: {
                    ...params.inputProps,
                    ...textField?.slotProps?.htmlInput,
                    autoComplete: 'new-password', // Disable autocomplete and autofill
                  },
                  ...(other.disabled && {
                    input: {
                      ...textField?.slotProps?.input,
                      sx: [
                        ...(Array.isArray(textField?.slotProps?.input?.sx)
                          ? textField.slotProps.input.sx
                          : [textField?.slotProps?.input?.sx].filter(Boolean)),
                        disabledFieldSx,
                      ],
                    },
                  }),
                }}
              />
            )}
            slotProps={otherSlotProps}
            {...other}
          />
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------
// Checkbox Components
// ----------------------------------------------------------------------

/**
 * React Hook Form Checkbox component
 * Handles single checkbox input
 * @param {object} sx - MUI sx prop
 * @param {string} name - Field name (required)
 * @param {string} label - Checkbox label
 * @param {object} slotProps - MUI slot props for customization
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} other - Additional props passed to FormControlLabel
 */
export function RHFCheckbox({ sx, name, label, slotProps, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box {...slotProps?.wrapper}>
          <FormControlLabel
            label={label}
            control={
              <Checkbox
                {...field}
                checked={!!field.value}
                {...slotProps?.checkbox}
                slotProps={{
                  ...slotProps?.checkbox?.slotProps,
                  input: {
                    id: generateFieldId(name, 'checkbox'),
                    ...(!label && { 'aria-label': `${name} checkbox` }),
                    ...slotProps?.checkbox?.slotProps?.input,
                  },
                }}
              />
            }
            sx={[
              { mx: 0 },
              ...(Array.isArray(sx) ? sx : [sx]),
              ...(other.disabled ? [disabledFieldSx] : []),
            ]}
            {...other}
          />

          <HelperText
            {...slotProps?.helperText}
            errorMessage={error?.message}
            helperText={helperText}
          />
        </Box>
      )}
    />
  );
}

/**
 * React Hook Form MultiCheckbox component
 * Handles multiple checkbox selection
 * @param {string} name - Field name (required)
 * @param {string} label - Field label
 * @param {Array} options - Array of {value, label} objects
 * @param {object} slotProps - MUI slot props for customization
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} other - Additional props passed to FormGroup
 */
export function RHFMultiCheckbox({ name, label, options, slotProps, helperText, ...other }) {
  const { control } = useFormContext();

  const getSelected = (selectedItems, item) =>
    selectedItems.includes(item)
      ? selectedItems.filter((value) => value !== item)
      : [...selectedItems, item];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const fieldValue = handleMultiSelectValue(field.value);

        return (
          <FormControl
            component="fieldset"
            {...slotProps?.wrapper}
            sx={[...(other.disabled ? [disabledFieldSx] : []), ...(Array.isArray(slotProps?.wrapper?.sx) ? slotProps.wrapper.sx : [slotProps?.wrapper?.sx].filter(Boolean))]}
          >
            {label && (
              <FormLabel
                component="legend"
                {...slotProps?.formLabel}
                sx={[
                  { mb: 1, typography: 'body2' },
                  ...(Array.isArray(slotProps?.formLabel?.sx)
                    ? slotProps.formLabel.sx
                    : [slotProps?.formLabel?.sx]),
                ]}
              >
                {label}
              </FormLabel>
            )}

            <FormGroup {...other}>
              {options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      checked={fieldValue.includes(option.value)}
                      onChange={() => field.onChange(getSelected(fieldValue, option.value))}
                      {...slotProps?.checkbox}
                      slotProps={{
                        ...slotProps?.checkbox?.slotProps,
                        input: {
                          id: generateFieldId(option.label, 'checkbox'),
                          ...(!option.label && { 'aria-label': `${option.label} checkbox` }),
                          ...slotProps?.checkbox?.slotProps?.input,
                        },
                      }}
                    />
                  }
                  label={option.label}
                />
              ))}
            </FormGroup>

            <HelperText
              {...slotProps?.helperText}
              disableGutters
              errorMessage={error?.message}
              helperText={helperText}
            />
          </FormControl>
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------
// Switch Components
// ----------------------------------------------------------------------

/**
 * React Hook Form Switch component
 * Handles single switch toggle
 * @param {string} name - Field name (required)
 * @param {ReactNode} helperText - Helper text to display
 * @param {string} label - Switch label
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} sx - MUI sx prop
 * @param {object} other - Additional props passed to FormControlLabel
 */
export function RHFSwitch({ name, helperText, label, slotProps, sx, onChange, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box {...slotProps?.wrapper}>
          <FormControlLabel
            label={label}
            control={
              <Switch
                {...field}
                checked={!!field.value}
                onChange={(e) => {
                  field.onChange(e.target.checked);
                  onChange?.(e, e.target.checked);
                }}
                {...slotProps?.switch}
                slotProps={{
                  ...slotProps?.switch?.slotProps,
                  input: {
                    id: generateFieldId(name, 'switch'),
                    ...(!label && { 'aria-label': `${name} switch` }),
                    ...slotProps?.switch?.slotProps?.input,
                  },
                }}
              />
            }
            sx={[
              { mx: 0 },
              ...(Array.isArray(sx) ? sx : [sx]),
              ...(other.disabled ? [disabledFieldSx] : []),
            ]}
            {...other}
          />

          <HelperText
            {...slotProps?.helperText}
            errorMessage={error?.message}
            helperText={helperText}
          />
        </Box>
      )}
    />
  );
}

/**
 * React Hook Form MultiSwitch component
 * Handles multiple switch toggles
 * @param {string} name - Field name (required)
 * @param {string} label - Field label
 * @param {Array} options - Array of {value, label} objects
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} other - Additional props passed to FormGroup
 */
export function RHFMultiSwitch({ name, label, options, helperText, slotProps, ...other }) {
  const { control } = useFormContext();

  const getSelected = (selectedItems, item) =>
    selectedItems.includes(item)
      ? selectedItems.filter((value) => value !== item)
      : [...selectedItems, item];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const fieldValue = handleMultiSelectValue(field.value);

        return (
          <FormControl
            component="fieldset"
            {...slotProps?.wrapper}
            sx={[...(other.disabled ? [disabledFieldSx] : []), ...(Array.isArray(slotProps?.wrapper?.sx) ? slotProps.wrapper.sx : [slotProps?.wrapper?.sx].filter(Boolean))]}
          >
            {label && (
              <FormLabel
                component="legend"
                {...slotProps?.formLabel}
                sx={[
                  { mb: 1, typography: 'body2' },
                  ...(Array.isArray(slotProps?.formLabel?.sx)
                    ? slotProps.formLabel.sx
                    : [slotProps?.formLabel?.sx]),
                ]}
              >
                {label}
              </FormLabel>
            )}

            <FormGroup {...other}>
              {options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Switch
                      checked={fieldValue.includes(option.value)}
                      onChange={() => field.onChange(getSelected(fieldValue, option.value))}
                      {...slotProps?.switch}
                      slotProps={{
                        ...slotProps?.switch?.slotProps,
                        input: {
                          id: generateFieldId(option.label, 'switch'),
                          ...(!option.label && {
                            'aria-label': `${option.label} switch`,
                          }),
                          ...slotProps?.switch?.slotProps?.input,
                        },
                      }}
                    />
                  }
                  label={option.label}
                />
              ))}
            </FormGroup>

            <HelperText
              {...slotProps?.helperText}
              disableGutters
              errorMessage={error?.message}
              helperText={helperText}
            />
          </FormControl>
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------
// RadioGroup Component
// ----------------------------------------------------------------------

/**
 * React Hook Form RadioGroup component
 * Handles radio button group selection
 * @param {object} sx - MUI sx prop
 * @param {string} name - Field name (required)
 * @param {string} label - Field label
 * @param {Array} options - Array of {value, label} objects
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} other - Additional props passed to RadioGroup
 */
export function RHFRadioGroup({ sx, name, label, options, helperText, slotProps, ...other }) {
  const { control } = useFormContext();

  const labelledby = generateFieldId(name, 'radios');

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl
          component="fieldset"
          {...slotProps?.wrapper}
          sx={[...(other.disabled ? [disabledFieldSx] : []), ...(Array.isArray(slotProps?.wrapper?.sx) ? slotProps.wrapper.sx : [slotProps?.wrapper?.sx].filter(Boolean))]}
        >
          {label && (
            <FormLabel
              id={labelledby}
              component="legend"
              {...slotProps?.formLabel}
              sx={[
                { mb: 1, typography: 'body2' },
                ...(Array.isArray(slotProps?.formLabel?.sx)
                  ? slotProps.formLabel.sx
                  : [slotProps?.formLabel?.sx]),
              ]}
            >
              {label}
            </FormLabel>
          )}

          <RadioGroup {...field} aria-labelledby={labelledby} sx={sx} {...other}>
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={
                  <Radio
                    {...slotProps?.radio}
                    slotProps={{
                      ...slotProps?.radio?.slotProps,
                      input: {
                        id: generateFieldId(option.label, 'radio'),
                        ...(!option.label && { 'aria-label': `${option.label} radio` }),
                        ...slotProps?.radio?.slotProps?.input,
                      },
                    }}
                  />
                }
                label={option.label}
              />
            ))}
          </RadioGroup>

          <HelperText
            {...slotProps?.helperText}
            disableGutters
            errorMessage={error?.message}
            helperText={helperText}
          />
        </FormControl>
      )}
    />
  );
}

// ----------------------------------------------------------------------
// NumberInput Component
// ----------------------------------------------------------------------

/**
 * React Hook Form NumberInput component
 * Handles numeric input with increment/decrement buttons
 * @param {string} name - Field name (required)
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} other - Additional props passed to NumberInput
 */
export function RHFNumberInput({ name, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <NumberInput
          {...field}
          onChange={(event, value) => field.onChange(value)}
          {...other}
          error={!!error}
          helperText={error?.message ?? helperText}
          sx={[
            ...(Array.isArray(other.sx) ? other.sx : [other.sx].filter(Boolean)),
            ...(other.disabled ? [disabledFieldSx] : []),
          ]}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------
// CountrySelect Component
// ----------------------------------------------------------------------

/**
 * React Hook Form CountrySelect component
 * Handles country selection with flag display
 * @param {string} name - Field name (required)
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} other - Additional props passed to CountrySelect
 */
export function RHFCountrySelect({ name, helperText, ...other }) {
  const { control, setValue } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <CountrySelect
          id={generateFieldId(name, 'rhf-country-select')}
          value={field.value ?? ''}
          onChange={(event, newValue) => setValue(name, newValue, { shouldValidate: true })}
          error={!!error}
          helperText={error?.message ?? helperText}
          {...other}
          sx={[
            ...(Array.isArray(other.sx) ? other.sx : [other.sx].filter(Boolean)),
            ...(other.disabled ? [disabledFieldSx] : []),
          ]}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------
// Upload Components
// ----------------------------------------------------------------------

/**
 * React Hook Form Upload component
 * Handles file upload with preview
 * Supports both local file storage and S3 upload
 * @param {string} name - Field name (required)
 * @param {boolean} multiple - Allow multiple file selection
 * @param {boolean} useS3 - Enable S3 upload (default: false, stores File objects locally)
 * @param {'presigned' | 'direct' | 'auto'} s3Mode - S3 upload mode (only used when useS3=true)
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} other - Additional props passed to Upload
 */
export function RHFUpload({
  name,
  multiple,
  useS3 = false,
  s3Mode = 'auto',
  helperText,
  ...other
}) {
  const { control, setValue, watch } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({});
  const [displayValue, setDisplayValue] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const uploadRef = useRef(false);

  const fieldValue = watch(name);

  const [getPresignedUrls] = useLazyGetPresignedUrlsQuery();
  const [getPresignedDownloadUrl] = useLazyGetPresignedDownloadUrlQuery();
  const [directUpload, { isLoading: isDirectUploading }] = useDirectUploadMutation();

  // Fetch presigned download URL when field value is an S3 objectKey
  useEffect(() => {
    if (!useS3 || !fieldValue || typeof fieldValue !== 'string') {
      setDisplayValue(fieldValue);
      return;
    }

    // Check if it's an S3 objectKey (starts with "items/")
    const isObjectKey = fieldValue.startsWith('items/');
    if (!isObjectKey) {
      // It's already a URL, use as-is
      setDisplayValue(fieldValue);
      return;
    }

    // Check if we have cached downloadUrl
    if (previewUrls[fieldValue]) {
      setDisplayValue(previewUrls[fieldValue]);
      return;
    }

    // Fetch presigned download URL
    setIsLoadingPreview(true);
    getPresignedDownloadUrl({ objectKey: fieldValue })
      .unwrap()
      .then((response) => {
        if (response.downloadUrl) {
          setPreviewUrls((prev) => ({ ...prev, [fieldValue]: response.downloadUrl }));
          setDisplayValue(response.downloadUrl);
        } else {
          setDisplayValue(fieldValue);
        }
      })
      .catch(() => {
        // On error, just show objectKey (no preview)
        setDisplayValue(fieldValue);
      })
      .finally(() => {
        setIsLoadingPreview(false);
      });
  }, [fieldValue, useS3, previewUrls, getPresignedDownloadUrl]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const uploadProps = {
          multiple,
          accept: { 'image/*': [] },
          error: !!error,
          helperText: error?.message ?? helperText,
          disabled: other.disabled || uploading || isDirectUploading,
        };

        const onDelete = () => {
          if (other.disabled || uploading || isDirectUploading || isLoadingPreview) return;

          // Clear form value
          setValue(name, multiple ? [] : null, { shouldValidate: true });

          // Clear cached preview URL if it exists
          if (useS3 && field.value && typeof field.value === 'string' && field.value.startsWith('items/')) {
            setPreviewUrls((prev) => {
              const newUrls = { ...prev };
              delete newUrls[field.value];
              return newUrls;
            });
          }

          // Reset display value
          setDisplayValue(null);
        };

        const onDrop = async (acceptedFiles, fileRejections) => {
          if (other.disabled || uploading || uploadRef.current) return;

          if (fileRejections.length > 0) return;

          if (acceptedFiles.length === 0) return;

          // S3 upload mode
          if (useS3) {
            setUploading(true);
            uploadRef.current = true;

            try {
              const uploadPromises = acceptedFiles.map(async (file) => {
                try {
                  let result;

                  if (s3Mode === 'presigned') {
                    const presignedResponse = await getPresignedUrls({
                      fileName: file.name,
                      contentType: file.type || 'image/png',
                      expirySeconds: 3600,
                    }).unwrap();

                    if (!presignedResponse.uploadUrl) {
                      throw new Error('Failed to get presigned upload URL');
                    }

                    await uploadFileViaPresigned(
                      file,
                      presignedResponse.uploadUrl,
                      file.type || 'image/png'
                    );

                    result = {
                      objectKey: presignedResponse.objectKey,
                      downloadUrl: presignedResponse.downloadUrl,
                    };
                  } else {
                    const formData = new FormData();
                    formData.append('file', file);

                    const uploadResult = await directUpload(formData).unwrap();

                    result = {
                      objectKey: uploadResult.objectKey,
                      downloadUrl: uploadResult.downloadUrl,
                    };
                  }

                  // Cache downloadUrl for preview
                  if (result.downloadUrl) {
                    setPreviewUrls((prev) => ({ ...prev, [result.objectKey]: result.downloadUrl }));
                  }

                  return result.objectKey;
                } catch (err) {
                  const { message } = getApiErrorMessage(err, {
                    defaultMessage: 'Upload failed',
                    validationMessage: 'Invalid file. Please check file size and type.',
                  });
                  throw new Error(message);
                }
              });

              const objectKeys = await Promise.all(uploadPromises);

              // Update value with objectKeys
              if (multiple) {
                const newValue = [
                  ...(Array.isArray(field.value) ? field.value : field.value ? [field.value] : []),
                  ...objectKeys,
                ];
                setValue(name, newValue, { shouldValidate: true });
              } else {
                setValue(name, objectKeys[0], { shouldValidate: true });
              }

              toast.success(multiple ? 'Files uploaded successfully' : 'File uploaded successfully');
            } catch (err) {
              const { message, isRetryable } = getApiErrorMessage(err, {
                defaultMessage: 'Upload failed',
                validationMessage: 'Invalid file. Please check file size and type.',
              });

              toast.error(message, {
                action: isRetryable
                  ? {
                      label: 'Retry',
                      onClick: () => {
                        // Retry by calling onDrop again
                        onDrop(acceptedFiles, []);
                      },
                    }
                  : undefined,
              });
            } finally {
              setUploading(false);
              uploadRef.current = false;
            }
          } else {
            // Local file storage (backward compatible)
            const value = multiple
              ? [...(Array.isArray(field.value) ? field.value : []), ...acceptedFiles]
              : acceptedFiles[0];

            setValue(name, value, { shouldValidate: true });
          }
        };

        return (
          <Upload
            {...uploadProps}
            value={useS3 ? displayValue ?? field.value : field.value}
            onDrop={onDrop}
            onDelete={onDelete}
            {...other}
            sx={[
              ...(Array.isArray(other.sx) ? other.sx : [other.sx].filter(Boolean)),
              ...(other.disabled || uploading || isDirectUploading || isLoadingPreview
                ? [disabledFieldSx]
                : []),
            ]}
          />
        );
      }}
    />
  );
}

/**
 * React Hook Form UploadBox component
 * Handles file upload in box format
 * @param {string} name - Field name (required)
 * @param {object} other - Additional props passed to UploadBox
 */
export function RHFUploadBox({ name, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <UploadBox
          value={field.value}
          error={!!error}
          {...other}
          sx={[
            ...(Array.isArray(other.sx) ? other.sx : [other.sx].filter(Boolean)),
            ...(other.disabled ? [disabledFieldSx] : []),
          ]}
        />
      )}
    />
  );
}

/**
 * React Hook Form UploadAvatar component
 * Handles avatar image upload
 * Supports both local file storage and S3 upload
 * @param {string} name - Field name (required)
 * @param {boolean} useS3 - Enable S3 upload (default: false, stores File objects locally)
 * @param {'presigned' | 'direct' | 'auto'} s3Mode - S3 upload mode (only used when useS3=true)
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} other - Additional props passed to UploadAvatar
 */
export function RHFUploadAvatar({
  name,
  useS3 = false,
  s3Mode = 'auto',
  slotProps,
  ...other
}) {
  const { control, setValue } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef(false);

  const [getPresignedUrls] = useLazyGetPresignedUrlsQuery();
  const [directUpload, { isLoading: isDirectUploading }] = useDirectUploadMutation();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const onDrop = async (acceptedFiles, fileRejections) => {
          if (other.disabled || uploading || uploadRef.current) return;

          if (fileRejections.length > 0) return;

          if (acceptedFiles.length === 0) return;

          const file = acceptedFiles[0];

          // S3 upload mode
          if (useS3) {
            setUploading(true);
            uploadRef.current = true;

            try {
              let result;

              if (s3Mode === 'presigned') {
                const presignedResponse = await getPresignedUrls({
                  fileName: file.name,
                  contentType: file.type || 'image/png',
                  expirySeconds: 3600,
                }).unwrap();

                if (!presignedResponse.uploadUrl) {
                  throw new Error('Failed to get presigned upload URL');
                }

                await uploadFileViaPresigned(
                  file,
                  presignedResponse.uploadUrl,
                  file.type || 'image/png'
                );

                result = {
                  objectKey: presignedResponse.objectKey,
                  downloadUrl: presignedResponse.downloadUrl,
                };
              } else {
                const formData = new FormData();
                formData.append('file', file);

                const uploadResult = await directUpload(formData).unwrap();

                result = {
                  objectKey: uploadResult.objectKey,
                  downloadUrl: uploadResult.downloadUrl,
                };
              }

              setValue(name, result.objectKey, { shouldValidate: true });
              toast.success('Avatar uploaded successfully');
            } catch (err) {
              const { message } = getApiErrorMessage(err, {
                defaultMessage: 'Upload failed',
                validationMessage: 'Invalid file. Please check file size and type.',
              });
              toast.error(message);
            } finally {
              setUploading(false);
              uploadRef.current = false;
            }
          } else {
            // Local file storage (backward compatible)
            const value = acceptedFiles[0];
            setValue(name, value, { shouldValidate: true });
          }
        };

        return (
          <Box
            {...slotProps?.wrapper}
            sx={[
              ...(other.disabled || uploading || isDirectUploading ? [disabledFieldSx] : []),
              ...(Array.isArray(slotProps?.wrapper?.sx)
                ? slotProps.wrapper.sx
                : [slotProps?.wrapper?.sx].filter(Boolean)),
            ]}
          >
            <UploadAvatar
              value={field.value}
              error={!!error}
              onDrop={onDrop}
              disabled={other.disabled || uploading || isDirectUploading}
              {...other}
            />

            <HelperText errorMessage={error?.message} sx={{ textAlign: 'center' }} />
          </Box>
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------
// Code Component
// ----------------------------------------------------------------------

/**
 * React Hook Form Code component (OTP Input)
 * Handles one-time password input
 * @param {string} name - Field name (required)
 * @param {object} slotProps - MUI slot props for customization
 * @param {ReactNode} helperText - Helper text to display
 * @param {number} maxSize - Maximum size for input boxes
 * @param {string} placeholder - Placeholder character
 * @param {object} other - Additional props passed to MuiOtpInput
 */
export function RHFCode({
  name,
  slotProps,
  helperText,
  maxSize = 56,
  placeholder = '-',
  ...other
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box
          {...slotProps?.wrapper}
          sx={[
            {
              [`& .${inputBaseClasses.input}`]: {
                p: 0,
                height: 'auto',
                aspectRatio: '1/1',
                maxWidth: maxSize,
              },
            },
            ...(Array.isArray(slotProps?.wrapper?.sx)
              ? slotProps.wrapper.sx
              : [slotProps?.wrapper?.sx]),
            ...(other.disabled ? [disabledFieldSx] : []),
          ]}
        >
          <MuiOtpInput
            {...field}
            autoFocus
            gap={1.5}
            length={6}
            TextFieldsProps={{
              placeholder,
              error: !!error,
              ...slotProps?.textField,
            }}
            {...other}
          />

          <HelperText
            {...slotProps?.helperText}
            errorMessage={error?.message}
            helperText={helperText}
          />
        </Box>
      )}
    />
  );
}

// ----------------------------------------------------------------------
// Rating Component
// ----------------------------------------------------------------------

/**
 * React Hook Form Rating component
 * Handles star rating input
 * @param {string} name - Field name (required)
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} other - Additional props passed to Rating
 */
export function RHFRating({ name, helperText, slotProps, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box
          {...slotProps?.wrapper}
          sx={[
            { display: 'flex', flexDirection: 'column' },
            ...(Array.isArray(slotProps?.wrapper?.sx)
              ? slotProps.wrapper.sx
              : [slotProps?.wrapper?.sx]),
            ...(other.disabled ? [disabledFieldSx] : []),
          ]}
        >
          <Rating
            {...field}
            onChange={(event, newValue) => field.onChange(Number(newValue))}
            {...other}
          />

          <HelperText
            {...slotProps?.helperText}
            disableGutters
            errorMessage={error?.message}
            helperText={helperText}
          />
        </Box>
      )}
    />
  );
}

// ----------------------------------------------------------------------
// Slider Component
// ----------------------------------------------------------------------

/**
 * React Hook Form Slider component
 * Handles range slider input
 * @param {string} name - Field name (required)
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} slotProps - MUI slot props for customization
 * @param {object} other - Additional props passed to Slider
 */
export function RHFSlider({ name, helperText, slotProps, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box
          {...slotProps?.wrapper}
          sx={[
            ...(other.disabled ? [disabledFieldSx] : []),
            ...(Array.isArray(slotProps?.wrapper?.sx) ? slotProps.wrapper.sx : [slotProps?.wrapper?.sx].filter(Boolean)),
          ]}
        >
          <Slider {...field} valueLabelDisplay="auto" {...other} />

          <HelperText
            {...slotProps?.helperText}
            disableGutters
            errorMessage={error?.message}
            helperText={helperText}
          />
        </Box>
      )}
    />
  );
}

// ----------------------------------------------------------------------
// Button Component
// ----------------------------------------------------------------------

/**
 * Normalizes icon prop - handles string (iconify) or ReactNode
 * @param {string|ReactNode} icon - Icon as string or ReactNode
 * @returns {ReactNode|null} - Normalized icon component or null
 */
function normalizeIcon(icon) {
  if (!icon) return null;
  if (typeof icon === 'string') {
    return <Iconify icon={icon} />;
  }
  return icon;
}

/**
 * Button component that uses form context
 */
function RHFButtonWithForm({
  loading: loadingProp,
  formLoading,
  ...buttonProps
}) {
  // Determine loading state: manual > formState > false
  const loading = loadingProp !== undefined ? loadingProp : formLoading;
  return <RHFButtonBase loading={loading} {...buttonProps} />;
}

/**
 * Base button component (no form context)
 */
function RHFButtonBase({
  loading: loadingProp = false,
  type = 'button',
  startIcon: startIconProp,
  endIcon: endIconProp,
  icon: iconProp,
  loadingIndicator,
  loadingPosition = 'start',
  variant,
  color,
  size,
  fullWidth,
  disabled: disabledProp,
  children,
  ...other
}) {
  // Determine disabled state: manual > loading
  const disabled = disabledProp !== undefined ? disabledProp : loadingProp;

  // Normalize icons (handle string as Iconify icon)
  const startIcon = normalizeIcon(startIconProp);
  const endIcon = normalizeIcon(endIconProp);
  const icon = normalizeIcon(iconProp);

  // Handle icon-only button
  const isIconOnly = !!icon && !children;

  // Handle loading with icons
  // When loading, hide icons and show loading indicator in position
  const finalStartIcon = loadingProp && loadingPosition === 'start' ? null : !loadingProp ? startIcon : null;
  const finalEndIcon = loadingProp && loadingPosition === 'end' ? null : !loadingProp ? endIcon : null;

  // Validate: icon-only button should have aria-label for accessibility
  if (isIconOnly && !other['aria-label'] && process.env.NODE_ENV !== 'production') {
    console.warn('RHFButton: Icon-only button should have an aria-label for accessibility.');
  }

  // Filter out internal MUI ButtonBase ref props that shouldn't be passed to DOM elements
  // These are internal refs used by ButtonBase and should not be spread to the Button component
  const {
    touchRippleRef: _touchRippleRef,
    focusRipple: _focusRipple,
    centerRipple: _centerRipple,
    ...buttonProps
  } = other;

  // If icon prop is provided, render icon-only button
  if (isIconOnly) {
    return (
      <Button
        type={type}
        variant={variant}
        color={color}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        loading={loadingProp}
        loadingIndicator={loadingIndicator}
        loadingPosition={loadingPosition}
        {...buttonProps}
        sx={[
          ...(Array.isArray(buttonProps.sx) ? buttonProps.sx : [buttonProps.sx].filter(Boolean)),
          ...(disabled ? [disabledFieldSx] : []),
        ]}
      >
        {icon}
      </Button>
    );
  }

  // Render button with text and optional icons
  return (
    <Button
      type={type}
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      loading={loadingProp}
      loadingIndicator={loadingIndicator}
      loadingPosition={loadingPosition}
      startIcon={finalStartIcon}
      endIcon={finalEndIcon}
      {...buttonProps}
      sx={[
        ...(Array.isArray(buttonProps.sx) ? buttonProps.sx : [buttonProps.sx].filter(Boolean)),
        ...(disabled ? [disabledFieldSx] : []),
      ]}
    >
      {children}
    </Button>
  );
}

/**
 * React Hook Form Button component
 * Handles button with form integration, loading states, and icon support
 * 
 * Note: If useFormState is true, component must be used within a Form component.
 * Set useFormState to false to use button outside form context (default behavior).
 * 
 * @param {boolean} useFormState - Use formState.isSubmitting for loading (default: false)
 * @param {boolean} loading - Manual loading state (overrides formState)
 * @param {string} type - Button type: 'button' | 'submit' | 'reset' (default: 'button')
 * @param {ReactNode|string} startIcon - Icon before text (string will be wrapped with Iconify)
 * @param {ReactNode|string} endIcon - Icon after text (string will be wrapped with Iconify)
 * @param {ReactNode|string} icon - Single icon (no text) - replaces children (string will be wrapped with Iconify)
 * @param {string} loadingIndicator - Custom loading text
 * @param {string} loadingPosition - Loading spinner position: 'start' | 'end' | 'center' (default: 'start')
 * @param {string} variant - Button variant: 'text' | 'outlined' | 'contained' | 'soft'
 * @param {string} color - Button color: 'inherit' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'
 * @param {string} size - Button size: 'small' | 'medium' | 'large'
 * @param {boolean} fullWidth - Full width button
 * @param {boolean} disabled - Disabled state
 * @param {ReactNode} children - Button content
 * @param {object} other - Additional props passed to Button
 */
export function RHFButton({
  useFormState = false,
  loading: loadingProp,
  ...buttonProps
}) {
  if (useFormState) {
    return <RHFButtonFormLoader loading={loadingProp} {...buttonProps} />;
  }
  return <RHFButtonBase loading={loadingProp} {...buttonProps} />;
}

/**
 * Loader that reads form context and passes formLoading to RHFButtonWithForm.
 * Only rendered when useFormState is true so hooks are not conditional in parent.
 */
function RHFButtonFormLoader({ loading: loadingProp, ...buttonProps }) {
  const formContext = useFormContext();
  const formLoading = formContext?.formState?.isSubmitting ?? false;
  return <RHFButtonWithForm loading={loadingProp} formLoading={formLoading} {...buttonProps} />;
}

// ----------------------------------------------------------------------
// Editor Component (Lazy-loaded)
// ----------------------------------------------------------------------

// Lazy-load RHFEditor to prevent Tiptap (~200KB) from bundling into every page using Field.*
const LazyRHFEditor = lazy(() =>
  import('src/components/hook-form/rhf-editor').then((mod) => ({ default: mod.RHFEditor }))
);

/**
 * React Hook Form Editor component (Lazy-loaded)
 * Handles rich text editor input
 * @param {string} name - Field name (required)
 * @param {ReactNode} helperText - Helper text to display
 * @param {object} other - Additional props passed to Editor
 */
function RHFEditorLazy(props) {
  return (
    <Suspense fallback={<div style={{ minHeight: 200 }} />}>
      <LazyRHFEditor {...props} />
    </Suspense>
  );
}

// ----------------------------------------------------------------------
// Export Field Namespace
// ----------------------------------------------------------------------

export const Field = {
  Code: RHFCode,
  Editor: RHFEditorLazy,
  Upload: RHFUpload,
  Switch: RHFSwitch,
  Slider: RHFSlider,
  Rating: RHFRating,
  Text: RHFTextField,
  Phone: RHFPhoneInput,
  Checkbox: RHFCheckbox,
  UploadBox: RHFUploadBox,
  RadioGroup: RHFRadioGroup,
  NumberInput: RHFNumberInput,
  MultiSelect: RHFMultiSelect,
  MultiSwitch: RHFMultiSwitch,
  UploadAvatar: RHFUploadAvatar,
  Autocomplete: RHFAutocomplete,
  MultiCheckbox: RHFMultiCheckbox,
  CountrySelect: RHFCountrySelect,
  Button: RHFButton,
  // Pickers
  DatePicker: RHFDatePicker,
  TimePicker: RHFTimePicker,
  DateTimePicker: RHFDateTimePicker,
};

