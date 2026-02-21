'use client';

import { merge } from 'es-toolkit';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { SettingsButton } from 'src/layouts/components/settings-button';
import { MainSection, LayoutSection, HeaderSection } from 'src/layouts/core';

import { Logo } from 'src/components/logo';

import { AuthSplitSection } from './section';
import { AuthSplitContent } from './content';

// ----------------------------------------------------------------------

export function AuthSplitLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = 'lg', // Changed from 'md' to 'lg' to hide sidebar sooner
  // New prop to enable crystal design
  useCrystalDesign = true,
}) {
  const renderHeader = () => {
    const headerSlotProps = {
      container: { maxWidth: false },
    };

    const headerSlots = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <>
          {/** @slot Logo - Hidden on crystal design since it's in sidebar */}
          {!useCrystalDesign && <Logo />}
        </>
      ),
      rightArea: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          {/** @slot Help link */}
          {/* <Link
            href={paths.faqs}
            component={RouterLink}
            color="inherit"
            sx={{ typography: 'subtitle2' }}
          >
            Need help?
          </Link> */}
          <Typography sx={{ typography: 'subtitle2' }}>Need help?</Typography>

          {/** @slot Settings button */}
          <SettingsButton />
        </Box>
      ),
    };

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={[
          {
            position: { [layoutQuery]: 'fixed' },
            // Hide header on crystal design - logo is in sidebar
            ...(useCrystalDesign && {
              display: { [layoutQuery]: 'none' },
            }),
          },
          ...(Array.isArray(slotProps?.header?.sx) ? slotProps.header.sx : [slotProps?.header?.sx]),
        ]}
      />
    );
  };

  const renderFooter = () => null;

  const renderMain = () => (
    <MainSection
      {...slotProps?.main}
      sx={[
        (theme) => ({
          [theme.breakpoints.up(layoutQuery)]: {
            flexDirection: 'row',
          },
        }),
        ...(Array.isArray(slotProps?.main?.sx) ? slotProps.main.sx : [slotProps?.main?.sx]),
      ]}
    >
      <AuthSplitSection
        layoutQuery={layoutQuery}
        method={CONFIG.auth.method}
        useCrystalDesign={useCrystalDesign}
        {...slotProps?.section}
        // Remove the auth method icons for crystal design
        methods={useCrystalDesign ? [] : [
          {
            label: 'Jwt',
            path: paths.auth.signIn,
            icon: `${CONFIG.assetsDir}assets/icons/platforms/ic-jwt.svg`,
          },
          {
            label: 'Firebase',
            path: paths.auth.signIn,
            icon: `${CONFIG.assetsDir}assets/icons/platforms/ic-firebase.svg`,
          },
          {
            label: 'Amplify',
            path: paths.auth.signIn,
            icon: `${CONFIG.assetsDir}assets/icons/platforms/ic-amplify.svg`,
          },
          {
            label: 'Auth0',
            path: paths.auth.signIn,
            icon: `${CONFIG.assetsDir}assets/icons/platforms/ic-auth0.svg`,
          },
          {
            label: 'Supabase',
            path: paths.auth.signIn,
            icon: `${CONFIG.assetsDir}assets/icons/platforms/ic-supabase.svg`,
          },
        ]}
      />
      <AuthSplitContent
        layoutQuery={layoutQuery}
        useCrystalDesign={useCrystalDesign}
        {...slotProps?.content}
      >
        {children}
      </AuthSplitContent>
    </MainSection>
  );

  return (
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
      cssVars={{
        '--layout-auth-content-width': useCrystalDesign ? '560px' : '420px',
        ...cssVars
      }}
      sx={sx}
    >
      {renderMain()}
    </LayoutSection>
  );
}
