'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Radio from '@mui/material/Radio';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import RadioGroup from '@mui/material/RadioGroup';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const PHONE_LABEL_OPTIONS = [
  { value: 1, label: 'Main' },
  { value: 2, label: 'Delivery' },
  { value: 3, label: 'Reservations' },
];

// ----------------------------------------------------------------------

export function PhoneNumbersField({ name = 'phoneNumbers', mode = 'create' }) {
  const { control, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const watchedPhones = watch(name);
  const phoneNumbers = useMemo(
    () => (watchedPhones && Array.isArray(watchedPhones) ? watchedPhones : []),
    [watchedPhones]
  );

  const primaryIndexFromForm = useMemo(() => {
    const index = phoneNumbers.findIndex((p) => p?.isPrimary === true);
    return index >= 0 ? index : (phoneNumbers.length > 0 ? 0 : -1);
  }, [phoneNumbers]);

  const [selectedPrimaryIndex, setSelectedPrimaryIndex] = useState(primaryIndexFromForm);

  useEffect(() => {
    setSelectedPrimaryIndex(primaryIndexFromForm);
  }, [primaryIndexFromForm]);

  const handleAdd = useCallback(() => {
    const isFirstPhone = phoneNumbers.length === 0;
    const newPhone = {
      phoneNumber: '',
      isPrimary: isFirstPhone,
      phoneLabel: null,
      ...(mode === 'edit' && {
        id: '',
        branchId: '',
        isActive: true,
      }),
    };
    append(newPhone);
    if (isFirstPhone) {
      setSelectedPrimaryIndex(0);
    }
  }, [append, phoneNumbers.length, mode]);

  const [shouldSetPrimaryAfterRemove, setShouldSetPrimaryAfterRemove] = useState(false);
  const previousFieldsLength = useRef(fields.length);

  const handleRemove = useCallback(
    (index) => {
      const wasPrimary = phoneNumbers[index]?.isPrimary;
      const willHavePhones = phoneNumbers.length > 1;
      remove(index);
      if (wasPrimary && willHavePhones) {
        setShouldSetPrimaryAfterRemove(true);
      } else if (phoneNumbers.length === 1) {
        setSelectedPrimaryIndex(-1);
      }
    },
    [remove, phoneNumbers]
  );

  useEffect(() => {
    if (shouldSetPrimaryAfterRemove && fields.length < previousFieldsLength.current && fields.length > 0) {
      setValue(`${name}.0.isPrimary`, true, { shouldValidate: true });
      setSelectedPrimaryIndex(0);
      setShouldSetPrimaryAfterRemove(false);
    }
    previousFieldsLength.current = fields.length;
  }, [fields.length, shouldSetPrimaryAfterRemove, setValue, name]);

  const handlePrimaryChange = useCallback(
    (event) => {
      const newPrimaryIndex = Number(event.target.value);
      const currentPhones = phoneNumbers || [];
      setSelectedPrimaryIndex(newPrimaryIndex);
      currentPhones.forEach((phone, i) => {
        const shouldBePrimary = i === newPrimaryIndex;
        setValue(`${name}.${i}.isPrimary`, shouldBePrimary, {
          shouldValidate: false,
          shouldDirty: true,
        });
      });
    },
    [phoneNumbers, setValue, name]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">Phone Numbers</Typography>
        <Field.Button
          size="small"
          variant="outlined"
          startIcon="mingcute:add-line"
          onClick={handleAdd}
          sx={{ minHeight: 44 }}
        >
          Add Phone
        </Field.Button>
      </Box>

      {fields.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
          No phone numbers added. Click &quot;Add Phone&quot; to add one.
        </Typography>
      ) : (
        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={selectedPrimaryIndex >= 0 ? selectedPrimaryIndex.toString() : ''}
            onChange={handlePrimaryChange}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {fields.map((field, index) => (
                <PhoneNumberItem
                  key={field.id}
                  index={index}
                  fieldName={`${name}.${index}`}
                  mode={mode}
                  isPrimary={phoneNumbers[index]?.isPrimary === true}
                  onRemove={() => handleRemove(index)}
                  canRemove={fields.length > 1}
                />
              ))}
            </Box>
          </RadioGroup>
        </FormControl>
      )}
    </Box>
  );
}

function PhoneNumberItem({ index, fieldName, mode, isPrimary, onRemove, canRemove }) {
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Radio value={index.toString()} sx={{ mt: -1 }} />

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Field.Phone
                  name={`${fieldName}.phoneNumber`}
                  label="Phone Number"
                  placeholder="Enter phone number"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <PhoneLabelSelect fieldName={`${fieldName}.phoneLabel`} />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Primary phone
                </Typography>
                {isPrimary && (
                  <Label color="primary" variant="soft" sx={{ fontSize: '0.75rem' }}>
                    Primary
                  </Label>
                )}
              </Box>
              {mode === 'edit' && (
                <Field.Switch
                  name={`${fieldName}.isActive`}
                  label="Active"
                />
              )}
            </Box>
          </Box>

          {canRemove && (
            <IconButton
              color="error"
              onClick={onRemove}
              sx={{ minWidth: 44, minHeight: 44 }}
              aria-label="Remove phone"
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function PhoneLabelSelect({ fieldName }) {
  const { watch, setValue } = useFormContext();

  const options = useMemo(
    () => PHONE_LABEL_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
    []
  );

  const currentValue = watch(fieldName);

  const selectedOption = useMemo(() => {
    if (currentValue === null || currentValue === undefined) return null;
    return options.find((opt) => opt.value === currentValue) || null;
  }, [currentValue, options]);

  return (
    <Field.Autocomplete
      name={fieldName}
      label="Phone Label"
      options={options}
      value={selectedOption}
      getOptionLabel={(option) => {
        if (!option) return '';
        return option.label || '';
      }}
      isOptionEqualToValue={(option, value) => {
        if (!option || !value) return option === value;
        return option.value === value.value;
      }}
      slotProps={{
        textField: {
          placeholder: 'Select label (optional)',
        },
      }}
      onChange={(event, newValue) => {
        const primitiveValue = newValue?.value ?? null;
        setValue(fieldName, primitiveValue, { shouldValidate: true });
      }}
    />
  );
}
