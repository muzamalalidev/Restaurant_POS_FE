'use client';

import { createPortal } from 'react-dom';
import { useRef, useState, useEffect, useCallback, useTransition } from 'react';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname } from 'src/routes/hooks';

import { MenuNavList } from './menu-nav-list';
// import { HomeWorthCard } from './home-worth-card';

// Animation durations (must match CSS)
const CLOSE_ANIMATION_DURATION = 350; // Slide-up animation duration

// ----------------------------------------------------------------------

// Focusable element selector for focus trap
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * MenuOverlay - Full-screen mobile menu with clip-path circle reveal animation
 *
 * Features:
 * - React Portal renders to document.body
 * - Clip-path circle animation from hamburger button position
 * - Body scroll lock when open
 * - Focus trap for accessibility (WCAG 2.4.3)
 * - Load-first navigation (starts navigation, shows loading bar, closes when page ready)
 * - Escape key to close
 *
 * @param {boolean} isOpen - Whether the menu is open
 * @param {function} onClose - Close function
 * @param {array} navData - Navigation data from nav-config-main
 */
export function MenuOverlay({ isOpen, onClose, navData }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);

  // useTransition tracks navigation loading state
  const [isPending, startTransition] = useTransition();

  // Separate closing state for slide-up animation
  const [isClosing, setIsClosing] = useState(false);

  // Track if we initiated a navigation (vs external navigation like back button)
  const pendingHrefRef = useRef(null);

  // Handle close with animation (for X button, Escape key)
  const handleClose = useCallback(() => {
    if (isClosing) return;

    setIsClosing(true);

    // After slide-up animation completes, actually close
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, CLOSE_ANIMATION_DURATION);
  }, [isClosing, onClose]);

  // Calculate clip-path origin from hamburger button position
  useEffect(() => {
    if (!overlayRef.current) return;

    const hamburger = document.querySelector('.mm-hamburger');
    if (!hamburger) return;

    const rect = hamburger.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    overlayRef.current.style.setProperty('--mm-clip-x', `${centerX}px`);
    overlayRef.current.style.setProperty('--mm-clip-y', `${centerY}px`);
  }, [isOpen]);

  // LOAD-FIRST navigation: start navigation immediately, close when page loads
  const handleNavigate = useCallback(
    (href) => {
      // If clicking current page link, just close
      if (href === pathname) {
        handleClose();
        return;
      }

      // Prevent double-navigation
      if (isPending || isClosing) return;

      // Track that we're navigating to this href
      pendingHrefRef.current = href;

      // Start navigation immediately - isPending becomes true
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, isPending, isClosing, handleClose, router]
  );

  // Close menu when navigation completes (pathname changes and isPending becomes false)
  useEffect(() => {
    // Only trigger if we initiated a navigation and it completed
    if (!isPending && pendingHrefRef.current && isOpen && !isClosing) {
      // Navigation complete - start close animation
      pendingHrefRef.current = null;
      setIsClosing(true);

      setTimeout(() => {
        setIsClosing(false);
        onClose();
      }, CLOSE_ANIMATION_DURATION);
    }
  }, [pathname, isPending, isOpen, isClosing, onClose]);

  // Handle external navigation (back button) - close menu if pathname changes unexpectedly
  useEffect(() => {
    if (isOpen && !isPending && !isClosing && !pendingHrefRef.current) {
      // Pathname changed but we didn't initiate it - close immediately
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Body scroll lock + inert on main content
  useEffect(() => {
    const appRoot = document.getElementById('__next') || document.getElementById('root');

    if (isOpen) {
      document.body.classList.add('mm-menu-open');
      document.body.style.overflow = 'hidden';

      // Make main content inert (unfocusable, hidden from screen readers)
      if (appRoot) {
        appRoot.setAttribute('inert', '');
        appRoot.setAttribute('aria-hidden', 'true');
      }
    } else {
      document.body.classList.remove('mm-menu-open');
      document.body.style.overflow = '';

      // Remove inert from main content
      if (appRoot) {
        appRoot.removeAttribute('inert');
        appRoot.removeAttribute('aria-hidden');
      }
    }

    return () => {
      document.body.classList.remove('mm-menu-open');
      document.body.style.overflow = '';
      if (appRoot) {
        appRoot.removeAttribute('inert');
        appRoot.removeAttribute('aria-hidden');
      }
    };
  }, [isOpen]);

  // Focus management: save previous focus, focus close button on open, restore on close
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element to restore later
      previousActiveElement.current = document.activeElement;

      // Focus the close button after animation starts
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
    // Restore focus when menu closes
    if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }

    return undefined;
  }, [isOpen]);

  // Focus trap: keep Tab/Shift+Tab within the overlay
  const handleKeyDown = useCallback(
    (event) => {
      if (!isOpen || isClosing) return;

      // Escape to close
      if (event.key === 'Escape') {
        handleClose();
        return;
      }

      // Focus trap on Tab
      if (event.key === 'Tab' && overlayRef.current) {
        const focusableElements = overlayRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Shift+Tab on first element -> wrap to last
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
        // Tab on last element -> wrap to first
        else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [isOpen, isClosing, handleClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Don't render on server
  if (typeof document === 'undefined') {
    return null;
  }

  // Determine overlay state class
  const getOverlayClass = () => {
    if (isClosing) return 'mm-overlay--closing';
    if (isOpen) return 'mm-overlay--open';
    return '';
  };

  const overlayContent = (
    <Box
      ref={overlayRef}
      className={`mm-root mm-overlay ${getOverlayClass()}`}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Header with brand and close button */}
      <Box className="mm-overlay__header">
        {/* Brand - matches footer styling */}
        <Box
          component="a"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNavigate('/');
          }}
          className="mm-brand"
        >
          <span className="mm-brand__name">Minimal</span>
          <span className="mm-brand__ext" />
        </Box>

        {/* Close button (X) - receives initial focus */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          className="mm-close-btn"
          aria-label="Close menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </Box>

      {/* Scrollable content area */}
      <Box className="mm-overlay__scroll">
        {/* Navigation List */}
        <MenuNavList data={navData} onNavigate={handleNavigate} />

        {/* Auth Buttons */}
        <Box className="mm-auth-buttons">
          <a
            href={paths.auth.signIn}
            onClick={(e) => {
              e.preventDefault();
              handleNavigate(paths.auth.signIn);
            }}
            className="mm-auth-btn mm-auth-btn--secondary"
          >
            Log In
          </a>
          <a
            href={paths.auth.signUp}
            onClick={(e) => {
              e.preventDefault();
              handleNavigate(paths.auth.signUp);
            }}
            className="mm-auth-btn mm-auth-btn--primary"
          >
            Sign Up
          </a>
        </Box>

        {/* Home Worth CTA Card - commented out for now */}
        {/* <HomeWorthCard onNavigate={handleNavigate} onClose={handleClose} /> */}
      </Box>
    </Box>
  );

  return createPortal(overlayContent, document.body);
}
