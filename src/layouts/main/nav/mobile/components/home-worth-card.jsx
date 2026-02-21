'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';

import { usePathname } from 'src/routes/hooks';

// Animation duration must match CSS --mm-duration-overlay (0.6s)
const CLOSE_ANIMATION_DURATION = 500;

// ----------------------------------------------------------------------

/**
 * SearchIcon - Magnifier icon for the search button
 */
function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

// ----------------------------------------------------------------------

/**
 * HomeWorthCard - CTA card asking "What's your home worth?"
 *
 * Features:
 * - Styled input with search button
 * - Scrolls to top of homepage on submit
 * - If not on homepage, navigates to "/" first
 * - Light blue gradient background
 *
 * @param {function} onNavigate - Navigate with animation (plays close animation, then navigates)
 * @param {function} onClose - Close menu callback (for scroll-only case)
 */
export function HomeWorthCard({ onNavigate, onClose }) {
  const pathname = usePathname();
  const [address, setAddress] = useState('');

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (pathname === '/') {
        // Already on homepage - play close animation, then scroll to top
        onClose();
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, CLOSE_ANIMATION_DURATION);
      } else {
        // Navigate to homepage with animation
        onNavigate('/');
      }
    },
    [pathname, onNavigate, onClose]
  );

  return (
    <Box className="mm-worth-card">
      <h3 className="mm-worth-card__title">Ready to get started?</h3>
      <p className="mm-worth-card__text">
        Explore the dashboard and discover all available features.
      </p>

      <form className="mm-worth-card__input-group" onSubmit={handleSubmit}>
        <input
          type="text"
          className="mm-worth-card__input"
          placeholder="Search features..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-label="Search features"
        />
        <button type="submit" className="mm-worth-card__btn" aria-label="Search">
          <SearchIcon />
        </button>
      </form>
    </Box>
  );
}
