import Divider from '@mui/material/Divider';

// ----------------------------------------------------------------------

export function FormDivider({ label = 'OR', sx, ...other }) {
  return (
    <Divider
      sx={[
        {
          my: 3,
          typography: 'overline',
          color: 'text.disabled',
          '&::before, &::after': { borderTopStyle: 'dashed' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {label}
    </Divider>
  );
}

