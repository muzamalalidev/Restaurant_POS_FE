'use client';

// Import premium mobile menu styles
import './nav/mobile/styles/mobile-menu.css';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useNavBack } from 'src/contexts/nav-back-context';
import { navData as mainNavData } from 'src/layouts/nav-config-main';
import { SignInButton } from 'src/layouts/components/sign-in-button';
import { SettingsButton } from 'src/layouts/components/settings-button';
import { MainSection, LayoutSection, HeaderSection } from 'src/layouts/core';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

import { NavDesktop } from './nav/desktop';
import { Footer, HomeFooter } from './footer';
import { MenuOverlay, HamburgerButton } from './nav/mobile';

// ----------------------------------------------------------------------

export function MainLayout({ sx, cssVars, children, slotProps, layoutQuery = 'md' }) {
  const pathname = usePathname();

  const isHomePage = pathname === '/';
  const isBlogPage = pathname.startsWith('/blog');
  const { navBack } = useNavBack();

  const navData = slotProps?.nav?.data ?? mainNavData;

  // Mobile menu state
  const { value: isMenuOpen, onToggle: toggleMenu, onFalse: closeMenu } = useBoolean();

  const renderHeader = () => {
    const brandContent = ({ showText = true, size = 'md' } = {}) => (
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        })}
      >
        <Logo
          sx={(theme) => ({
            width: size === 'sm' ? 36 : 42,
            height: size === 'sm' ? 36 : 42,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: theme.transitions.create(['transform'], {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }),
            '& img, & svg': {
              width: size === 'sm' ? 32 : 36,
              height: size === 'sm' ? 32 : 36,
            },
            '[data-offset="true"] &': {
              transform: 'scale(0.92)',
            },
          })}
        />

        {showText && (
          <Typography
            component={RouterLink}
            href="/"
            variant={size === 'sm' ? 'h5' : 'h4'}
            sx={(theme) => ({
              fontFamily: theme.typography.fontSecondaryFamily,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              textDecoration: 'none',
              cursor: 'pointer',
              color: theme.vars.palette.text.primary,
              '& .brand-extension': {
                color: theme.vars.palette.primary.main,
              },
              '&:hover': {
                textDecoration: 'none',
              },
            })}
          >
            <span className="brand-name">Minimal</span>
            <span className="brand-extension" />
          </Typography>
        )}
      </Box>
    );

    const desktopActions = (
      <Box
        className="main-nav-actions"
        sx={(theme) => ({
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: theme.spacing(0.75),
        })}
      >
        <SettingsButton
          sx={(theme) => ({
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid transparent',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color'], {
              duration: theme.transitions.duration.shorter,
              easing: theme.transitions.easing.easeInOut,
            }),
            '&:hover': {
              backgroundColor: 'transparent',
              boxShadow: 'none',
            },
            '[data-offset="true"] &': {
              backgroundColor: 'transparent',
              borderColor: 'transparent',
              boxShadow: 'none',
            },
          })}
        />

        <SignInButton
          sx={(theme) => ({
            height: 36,
            borderRadius: 999,
            paddingInline: theme.spacing(2.5),
            borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.24),
            backgroundColor: theme.vars.palette.background.paper,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            transition: theme.transitions.create(['border-color', 'box-shadow'], {
              duration: theme.transitions.duration.shorter,
              easing: theme.transitions.easing.easeInOut,
            }),
            '&:hover': {
              borderColor: theme.vars.palette.common.black,
              boxShadow: '0 0 0 1px black', // Create thicker border effect without layout shift
            },
          })}
        />

        <Button
          component={RouterLink}
          variant="contained"
          href={paths.auth.signUp}
          sx={(theme) => ({
            height: 36,
            borderRadius: 999,
            paddingInline: theme.spacing(2.75),
            fontWeight: 700,
            whiteSpace: 'nowrap',
            border: 'none',
            boxShadow: '0 18px 36px rgba(15, 23, 42, 0.16)',
            transition: theme.transitions.create(['box-shadow'], {
              duration: theme.transitions.duration.shorter,
              easing: theme.transitions.easing.easeInOut,
            }),
            '&:hover': {
              boxShadow: '0 22px 44px rgba(15, 23, 42, 0.2)',
            },
            '&:focus': {
              outline: 'none',
              border: 'none',
            },
          })}
        >
          Sign Up
        </Button>
      </Box>
    );

    const desktopNav = (
      <Box
        className="main-nav-shell"
        sx={(theme) => ({
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing(2.5),
          paddingTop: theme.spacing(0.85),
          paddingBottom: theme.spacing(0.85),
          paddingLeft: 0,
          paddingRight: theme.spacing(3.25),
          borderRadius: 32,
          border: '1px solid transparent',
          backgroundColor: isBlogPage
            ? varAlpha(theme.vars.palette.background.paperChannel, 0.65)
            : 'transparent',
          backdropFilter: isBlogPage ? 'blur(30px)' : 'none',
          boxShadow: isBlogPage ? '0 5px 6px rgba(15, 23, 42, 0.07)' : 'none',
          ...(isBlogPage && {
            borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.18),
          }),
          width: '100%',
          maxWidth: 1400,
          margin: '0 auto',
          marginTop: { xs: theme.spacing(0.75), md: theme.spacing(1.75) },
          transition: theme.transitions.create(
            [
              'max-width',
              'padding',
              'border-radius',
              'box-shadow',
              'gap',
              'background-color',
              'border-color',
              'backdrop-filter',
              'margin-top',
            ],
            {
              duration: theme.transitions.duration.standard,
              easing: theme.transitions.easing.easeInOut,
            }
          ),
          '[data-offset="true"] &': {
            // Mobile: Keep rectangular background/border
            borderRadius: { xs: 32, md: 999 },
            maxWidth: { xs: 1400, sm: 1400, md: 820, lg: 900 },
            paddingTop: theme.spacing(0.85),
            paddingBottom: theme.spacing(0.85),
            paddingLeft: { xs: 0, md: theme.spacing(1.25) },
            paddingRight: { xs: theme.spacing(3.25), md: theme.spacing(2.6) },
            boxShadow: '0 5px 6px rgba(15, 23, 42, 0.07)',
            gap: { xs: theme.spacing(2.5), md: theme.spacing(2) },
            backgroundColor: varAlpha(theme.vars.palette.background.paperChannel, 0.65),
            borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.18),
            backdropFilter: 'blur(30px)',
            marginTop: { xs: theme.spacing(0.75), md: theme.spacing(1.75) },
          },
        })}
      >
        {/* Back arrow — fades into the nav pill when blog hero scrolls out of view */}
        {isBlogPage && (
          <Box
            component={RouterLink}
            href={navBack?.href || '/blog'}
            aria-label="Back to blog"
            sx={(theme) => ({
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: navBack ? 34 : 0,
              height: 34,
              minWidth: 0,
              borderRadius: '50%',
              opacity: navBack ? 1 : 0,
              overflow: 'hidden',
              flexShrink: 0,
              color: theme.vars.palette.text.primary,
              textDecoration: 'none',
              transition: theme.transitions.create(['opacity', 'width', 'margin'], {
                duration: 350,
                easing: theme.transitions.easing.easeInOut,
              }),
              marginRight: navBack ? theme.spacing(0.25) : 0,
              '&:hover': {
                backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.1),
              },
            })}
          >
            <Iconify icon="solar:arrow-left-linear" width={18} />
          </Box>
        )}

        {brandContent()}

        <NavDesktop
          data={navData}
          sx={(theme) => ({
            flex: '1 1 auto',
            justifyContent: 'center',
            '& ul': {
              gap: theme.spacing(3),
            },
            '& a': {
              fontWeight: 600,
              color: theme.vars.palette.text.primary,
              whiteSpace: 'nowrap',
              transition: theme.transitions.create(['color'], {
                duration: theme.transitions.duration.shorter,
              }),
            },
          })}
        />

        {desktopActions}
      </Box>
    );

    const mobileActions = (
      <Box
        sx={(theme) => ({
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          gap: theme.spacing(0.5),
        })}
      >
        <SettingsButton sx={{ width: 40, height: 40 }} />

        <SignInButton
          sx={(theme) => ({
            height: 36,
            borderRadius: 999,
            paddingInline: theme.spacing(2),
            whiteSpace: 'nowrap',
            backgroundColor: 'transparent',
            borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.24),
            fontWeight: 600,
            transition: theme.transitions.create(['border-color', 'box-shadow'], {
              duration: theme.transitions.duration.shorter,
              easing: theme.transitions.easing.easeInOut,
            }),
            '&:hover': {
              borderColor: theme.vars.palette.common.black,
              boxShadow: '0 0 0 1px black', // Create thicker border effect without layout shift
            },
          })}
        />

        {/* Premium hamburger menu button */}
        <HamburgerButton isOpen={isMenuOpen} onToggle={toggleMenu} />
      </Box>
    );

    const headerSlots = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <Box
          sx={(theme) => ({
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            flex: '0 0 auto',
          })}
        >
          {brandContent({ size: 'sm' })}
        </Box>
      ),
      centerArea: desktopNav,
      rightArea: mobileActions,
    };

    const containerSlot = slotProps?.header?.slotProps?.container ?? {};
    const containerSxBase = (theme) => ({
      alignItems: { xs: 'center', md: 'flex-start' },
      justifyContent: 'center',
      paddingTop: { xs: 0, md: theme.spacing(1.5) },
      paddingBottom: { xs: 0, md: theme.spacing(1.25) },
      // Mobile navbar background
      [theme.breakpoints.down('md')]: {
        backgroundColor: 'transparent',
        borderBottom: 'none',
        '[data-offset="true"] &': {
          backgroundColor: varAlpha(theme.vars.palette.background.paperChannel, 0.65),
          borderBottom: `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.18)}`,
          backdropFilter: 'blur(30px)',
        },
      },
    });
    const containerSx = [
      containerSxBase,
      ...(Array.isArray(containerSlot.sx)
        ? containerSlot.sx
        : containerSlot.sx
          ? [containerSlot.sx]
          : []),
    ];

    return (
      <HeaderSection
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={{
          ...slotProps?.header?.slotProps,
          container: {
            ...containerSlot,
            sx: containerSx,
          },
        }}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderFooter = () =>
    isHomePage ? (
      <HomeFooter sx={slotProps?.footer?.sx} />
    ) : (
      <Footer sx={slotProps?.footer?.sx} layoutQuery={layoutQuery} />
    );

  const renderMain = () => <MainSection {...slotProps?.main}>{children}</MainSection>;

  return (
    <>
      {/* Premium mobile menu overlay (renders via Portal) */}
      <MenuOverlay isOpen={isMenuOpen} onClose={closeMenu} navData={navData} />

      <LayoutSection
        /** **************************************
         * @Header
         *************************************** */
        headerSection={renderHeader()}
        /** **************************************
         * @Footer
         *************************************** */
        footerSection={renderFooter()}
        /** **************************************
         * @Styles
         *************************************** */
        cssVars={cssVars}
        sx={sx}
      >
        {renderMain()}
      </LayoutSection>
    </>
  );
}
