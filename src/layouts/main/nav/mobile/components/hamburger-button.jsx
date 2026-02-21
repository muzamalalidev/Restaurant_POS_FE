'use client';

import { forwardRef } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

/**
 * HamburgerButton - Animated 3-line to X hamburger menu button
 *
 * Features:
 * - Three lines with middle line shorter (asymmetric design)
 * - Transforms to X when isOpen is true
 * - 44x44px touch target for mobile accessibility
 * - Pure CSS animation via class toggle
 *
 * @param {boolean} isOpen - Whether the menu is open
 * @param {function} onToggle - Toggle function for menu state
 * @param {object} sx - Additional MUI sx styles
 */
export const HamburgerButton = forwardRef(({ isOpen, onToggle, sx, ...other }, ref) => (
  <Box
    ref={ref}
    component="button"
    type="button"
    onClick={onToggle}
    aria-label={isOpen ? 'Close menu' : 'Open menu'}
    aria-expanded={isOpen}
    className={`mm-hamburger ${isOpen ? 'mm-hamburger--active' : ''}`}
    sx={[
      {
        // Only show on mobile (below md breakpoint)
        display: { xs: 'flex', md: 'none' },
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...other}
  >
    <span className="mm-hamburger__box">
      <span className="mm-hamburger__line mm-hamburger__line--top" />
      <span className="mm-hamburger__line mm-hamburger__line--middle" />
      <span className="mm-hamburger__line mm-hamburger__line--bottom" />
    </span>
  </Box>
));

HamburgerButton.displayName = 'HamburgerButton';
