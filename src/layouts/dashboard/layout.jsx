'use client';

import { merge } from 'es-toolkit';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import { BreadcrumbsPortalProvider } from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';

import { dashboardLayoutVars, dashboardNavColorVars } from './css-vars';
import { navData } from '../nav-config-dashboard';
import { MenuButton } from '../components/menu-button';
import { SettingsButton } from '../components/settings-button';
import { Sidebar, useSidebar, SidebarProvider } from '../sidebar';
import { ModeToggleButton } from '../components/mode-toggle-button';
import { MainSection, HeaderSection, LayoutSection } from '../core';
import { NavHorizontal } from './nav-horizontal';

// ----------------------------------------------------------------------

export function DashboardLayout({ sx, cssVars, children, slotProps, layoutQuery = 'lg' }) {
  return (
    <SidebarProvider>
      <DashboardLayoutInner
        sx={sx}
        cssVars={cssVars}
        slotProps={slotProps}
        layoutQuery={layoutQuery}
      >
        {children}
      </DashboardLayoutInner>
    </SidebarProvider>
  );
}

// Inner component has access to SidebarProvider context
function DashboardLayoutInner({ sx, cssVars, children, slotProps, layoutQuery = 'lg' }) {
  const theme = useTheme();
  const { isCollapsed, openMobile } = useSidebar();
  const settings = useSettingsContext();

  const navDataToUse = slotProps?.nav?.data ?? navData;
  const { navLayout, navColor } = settings.state;

  const renderHeader = () => {
    const headerSlotProps = {
      container: {
        maxWidth: false,
        sx: {
          px: { [layoutQuery]: 0 },
        },
      },
    };

    // Get nav color vars for horizontal navigation
    const navColorVars = dashboardNavColorVars(theme, navColor, navLayout);

    const headerSlots = {
      topArea: (
        <>
          {navLayout === 'horizontal' && (
            <NavHorizontal
              data={navDataToUse}
              layoutQuery={layoutQuery}
              cssVars={navColorVars?.section}
            />
          )}
          <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
            This is an info Alert.
          </Alert>
        </>
      ),
      leftArea: (
        <MenuButton
          onClick={openMobile}
          sx={{ mr: 1, ml: -1, '@media (min-width: 1025px)': { display: 'none' } }}
        />
      ),
      rightArea: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.75 } }}>
          <ModeToggleButton />
          <SettingsButton />
        </Box>
      ),
    };

    return (
      <HeaderSection
        layoutQuery={layoutQuery}
        disableElevation
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderMain = () => {
    const mainSx = slotProps?.main?.sx;
    return (
      <MainSection
        {...slotProps?.main}
        sx={[
          { maxWidth: '100%', pr: 0, pl: 0 },
          ...(Array.isArray(mainSx) ? mainSx : mainSx ? [mainSx] : []),
        ]}
      >
        {children}
      </MainSection>
    );
  };

  // Calculate layout padding based on navLayout
  const getLayoutPadding = () => {
    // Standard horizontal padding for consistency (4 * 8px = 32px at lg breakpoint)
    const horizontalPadding = { [layoutQuery]: 4 };
    // Mobile padding (2 * 8px = 16px)
    const mobilePadding = 2;

    // Horizontal layout: Add left padding for consistency when sidebar is hidden
    if (navLayout === 'horizontal') {
      return {
        '@media (min-width: 1025px)': {
          pl: horizontalPadding,
          pr: horizontalPadding,
        },
        '@media (max-width: 1024px)': {
          pl: mobilePadding,
          pr: mobilePadding,
        },
      };
    }

    // Standard right padding for vertical and mini modes
    const rightPadding = { [layoutQuery]: 4 };

    // Mini mode always uses collapsed width
    if (navLayout === 'mini') {
      return {
        '@media (min-width: 1025px)': {
          pl: 'calc(var(--sidebar-collapsed-width) + 16px)',
          pr: rightPadding,
          transition: 'padding-left var(--transition-slow) cubic-bezier(0.25, 1.15, 0.5, 1)',
        },
        '@media (max-width: 1024px)': {
          pl: mobilePadding,
          pr: mobilePadding,
        },
      };
    }

    // Vertical mode uses normal padding logic
    return {
      '@media (min-width: 1025px)': {
        pl: isCollapsed
          ? 'calc(var(--sidebar-collapsed-width) + 16px)'
          : 'calc(var(--sidebar-width) + 16px)',
        pr: rightPadding,
        transition: 'padding-left var(--transition-slow) cubic-bezier(0.25, 1.15, 0.5, 1)',
      },
      '@media (max-width: 1024px)': {
        pl: mobilePadding,
        pr: mobilePadding,
      },
    };
  };

  // Get nav color vars for layout
  const navColorVarsForLayout = dashboardNavColorVars(theme, navColor, navLayout);

  return (
    <BreadcrumbsPortalProvider>
      {/* Always render Sidebar - CSS handles desktop hiding for horizontal mode */}
      {/* Mobile drawer must always be available regardless of navLayout */}
      <Sidebar navData={navDataToUse} />

      <LayoutSection
        headerSection={renderHeader()}
        sidebarSection={null}
        footerSection={null}
        cssVars={{
          ...dashboardLayoutVars(theme),
          ...navColorVarsForLayout?.layout,
          ...cssVars,
        }}
        sx={[getLayoutPadding(), ...(Array.isArray(sx) ? sx : [sx])]}
      >
        {renderMain()}
      </LayoutSection>
    </BreadcrumbsPortalProvider>
  );
}
