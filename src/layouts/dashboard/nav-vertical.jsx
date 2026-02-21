import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { layoutClasses } from 'src/layouts/core';
import { NavUpgrade } from 'src/layouts/components/nav-upgrade';
import { NavToggleButton } from 'src/layouts/components/nav-toggle-button';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';
import { NavSectionMini, NavSectionVertical } from 'src/components/nav-section';

// ----------------------------------------------------------------------

export function NavVertical({
  sx,
  data,
  slots,
  cssVars,
  className,
  isNavMini,
  onToggleNav,
  checkPermissions,
  layoutQuery = 'md',
  ...other
}) {
  const renderNavVertical = () => (
    <>
      {slots?.topArea ?? (
        <Box sx={{ pl: 2.25, py: 2.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Logo />
          <Typography
            component={RouterLink}
            href="/"
            variant="h4"
            sx={(theme) => ({
              fontFamily: theme.typography.fontSecondaryFamily, // Barlow font
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              textDecoration: 'none',
              cursor: 'pointer',
              '& .brand-name': {
                color: theme.palette.text.primary, // Black in light mode
                ...theme.applyStyles('dark', {
                  color: theme.palette.common.white, // White in dark mode
                }),
              },
              '& .brand-extension': {
                color: theme.palette.primary.main, // Blue color for .io
              },
              '&:hover': {
                textDecoration: 'none',
              },
            })}
          >
            <span className="brand-name">Minimal</span>
            <span className="brand-extension" />
          </Typography>
        </Box>
      )}

      <Scrollbar fillContent>
        <NavSectionVertical
          data={data}
          cssVars={cssVars}
          checkPermissions={checkPermissions}
          sx={{ px: 2, flex: '1 1 auto' }}
        />

        {slots?.bottomArea ?? <NavUpgrade />}
      </Scrollbar>
    </>
  );

  const renderNavMini = () => (
    <>
      {slots?.topArea ?? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5 }}>
          <Logo />
        </Box>
      )}

      <NavSectionMini
        data={data}
        cssVars={cssVars}
        checkPermissions={checkPermissions}
        sx={[
          (theme) => ({
            ...theme.mixins.hideScrollY,
            pb: 2,
            px: 0.5,
            flex: '1 1 auto',
            overflowY: 'auto',
          }),
        ]}
      />

      {slots?.bottomArea}
    </>
  );

  return (
    <NavRoot
      isNavMini={isNavMini}
      layoutQuery={layoutQuery}
      className={mergeClasses([layoutClasses.nav.root, layoutClasses.nav.vertical, className])}
      sx={sx}
      {...other}
    >
      <NavToggleButton
        isNavMini={isNavMini}
        onClick={onToggleNav}
        sx={[
          (theme) => ({
            display: 'none',
            [theme.breakpoints.up(layoutQuery)]: { display: 'inline-flex' },
          }),
        ]}
      />
      {isNavMini ? renderNavMini() : renderNavVertical()}
    </NavRoot>
  );
}

// ----------------------------------------------------------------------

const NavRoot = styled('div', {
  shouldForwardProp: (prop) => !['isNavMini', 'layoutQuery', 'sx'].includes(prop),
})(({ isNavMini, layoutQuery = 'md', theme }) => ({
  top: 0,
  left: 0,
  height: '100%',
  display: 'none',
  position: 'fixed',
  flexDirection: 'column',
  zIndex: 'var(--layout-nav-zIndex)',
  backgroundColor: 'var(--layout-nav-bg)',
  width: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
  borderRight: `1px solid var(--layout-nav-border-color, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)})`,
  transition: theme.transitions.create(['width'], {
    easing: 'var(--layout-transition-easing)',
    duration: 'var(--layout-transition-duration)',
  }),
  [theme.breakpoints.up(layoutQuery)]: { display: 'flex' },
}));
