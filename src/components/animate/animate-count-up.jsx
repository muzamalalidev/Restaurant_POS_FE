'use client';

import { useRef, useEffect } from 'react';
import { m, animate, useInView, useTransform, useMotionValue } from 'framer-motion';

import Typography from '@mui/material/Typography';

import { fNumber } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export function AnimateCountUp({
  to,
  sx,
  from = 0,
  toFixed = 0,
  once = true,
  duration = 2,
  amount = 0.5,
  unit: unitProp,
  component = 'p',
  shorten = true,
  formatWithLocale = false,
  formatOptions,
  formatter, // Extract formatter to prevent it from being passed to DOM
  ...other
}) {
  const countRef = useRef(null);

  const shortNumber = shorten ? shortenNumber(to) : undefined;

  const startCount = useMotionValue(from);
  const endCount = shortNumber ? shortNumber.value : to;

  const unit = unitProp ?? (shorten ? shortNumber?.unit : undefined);

  const inView = useInView(countRef, { once, amount });

  const rounded = useTransform(startCount, (latest) =>
    latest.toFixed(isFloat(latest) ? toFixed : 0)
  );

  const formatted = useTransform(rounded, (latest) => {
    if (!formatWithLocale) return latest;
    const numeric = Number(latest);
    if (Number.isNaN(numeric)) return latest;
    return fNumber(numeric, formatOptions);
  });

  useEffect(() => {
    if (inView) {
      animate(startCount, endCount, { duration });
    }
  }, [duration, endCount, inView, startCount]);

  return (
    <Typography
      component={component}
      sx={[
        {
          p: 0,
          m: 0,
          display: 'inline-flex',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <m.span ref={countRef}>{formatted}</m.span>
      {unit}
    </Typography>
  );
}

// ----------------------------------------------------------------------

function isFloat(n) {
  return typeof n === 'number' && !Number.isInteger(n);
}

function shortenNumber(value) {
  if (value >= 1e9) {
    return { unit: 'b', value: value / 1e9 };
  }
  if (value >= 1e6) {
    return { unit: 'm', value: value / 1e6 };
  }
  if (value >= 1e3) {
    return { unit: 'k', value: value / 1e3 };
  }
  return undefined;
}
