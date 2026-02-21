'use client';

import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';

import { layoutClasses } from '../core';

// ----------------------------------------------------------------------

export function AuthSplitContent({
  sx,
  children,
  className,
  layoutQuery = 'md',
  // New prop to enable crystal design styling
  useCrystalDesign = true,
  ...other
}) {
  if (useCrystalDesign) {
    return (
      <Box
        className={mergeClasses([layoutClasses.content, className])}
        sx={[
          (theme) => ({
            display: 'flex',
            flex: '1 1 auto',
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            bgcolor: '#ffffff',
            py: theme.spacing(2),
            px: theme.spacing(2),
            [theme.breakpoints.up('sm')]: {
              py: theme.spacing(3),
            },
            [theme.breakpoints.up(layoutQuery)]: {
              py: theme.spacing(6),
              px: theme.spacing(6),
            },
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {/* Subtle Grid Background */}
        {/* <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.4,
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(241 245 249 / 0.8)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
            pointerEvents: 'none',
            maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
          }}
        /> */}

        {/* Gradient Blob Top Right - Hidden on mobile for performance */}
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: 0,
            right: 0,
            width: 600,
            height: 600,
            background: 'linear-gradient(to bottom, rgba(240, 249, 255, 0.8), transparent)',
            borderRadius: '50%',
            pointerEvents: 'none',
            // Blur is expensive on mobile - only show on tablet+
            display: { xs: 'none', md: 'block' },
            filter: 'blur(120px)',
          })}
        />

        {/* Content */}
        <Box
          sx={{
            width: 1,
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 'var(--layout-auth-content-width)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  // Original design
  return (
    <Box
      className={mergeClasses([layoutClasses.content, className])}
      sx={[
        (theme) => ({
          display: 'flex',
          flex: '1 1 auto',
          alignItems: 'center',
          flexDirection: 'column',
          p: theme.spacing(3, 2, 10, 2),
          [theme.breakpoints.up(layoutQuery)]: {
            justifyContent: 'center',
            p: theme.spacing(10, 2, 10, 2),
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        sx={{
          width: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 'var(--layout-auth-content-width)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
