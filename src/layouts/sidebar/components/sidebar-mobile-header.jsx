'use client';

import Backdrop from '@mui/material/Backdrop';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { primaryColorPresets } from 'src/theme/with-settings';

import { useSettingsContext } from 'src/components/settings';

import { useAuthContext } from 'src/auth/hooks';

import { useSidebar } from '../sidebar-context';

// Mobile header bar - visible below 1024px

export function SidebarMobileHeader() {
  const { isMobileOpen, openMobile } = useSidebar();
  const { user } = useAuthContext();
  const _theme = useTheme();
  const settings = useSettingsContext();

  const initials = getInitials(user?.displayName || user?.email || '');

  // Get primary color preset for logo gradient
  const primaryPreset = primaryColorPresets[settings.state.primaryColor] || primaryColorPresets.default;
  const primaryLight = primaryPreset.light;
  const primaryMain = primaryPreset.main;

  return (
    <header className={`mobile-header${isMobileOpen ? ' sidebar-open' : ''}`}>
      <button type="button" className="mobile-menu-toggle" onClick={openMobile} aria-label="Open menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <a href={paths.platform.tenantMasters.root} className="mobile-logo">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
          <defs>
            <linearGradient id="mobileLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryLight} />
              <stop offset="100%" stopColor={primaryMain} />
            </linearGradient>
          </defs>
          <path
            d="M12 2L3 9v11a2 2 0 0 0 2 2h4v-8h6v8h4a2 2 0 0 0 2-2V9L12 2z"
            fill="url(#mobileLogoGradient)"
          />
        </svg>
        <span>Minimal</span>
      </a>

      <div className="mobile-header-avatar">{initials}</div>
    </header>
  );
}

// Mobile overlay backdrop — uses MUI Backdrop to avoid Safari 26 fixed-overlay compositing bug
export function SidebarMobileOverlay() {
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <Backdrop
      open={isMobileOpen}
      onClick={closeMobile}
      sx={{
        zIndex: 1199,
        display: { xs: 'block', lg: 'none' },
      }}
    />
  );
}

// ----------------------------------------------------------------------

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
