import 'src/global.css';

import GlobalStyles from '@mui/material/GlobalStyles';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

import { CONFIG } from 'src/global-config';
import { primary } from 'src/theme/core/palette';
import { LocalizationProvider } from 'src/locales';
import { ReduxProvider } from 'src/store/provider';
import { detectLanguage } from 'src/locales/server';
import { themeConfig, ThemeProvider } from 'src/theme';
import { I18nProvider } from 'src/locales/i18n-provider';

import { Snackbar } from 'src/components/snackbar';
import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { detectSettings } from 'src/components/settings/server';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider as JwtAuthProvider } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: primary.main,
};

// ----------------------------------------------------------------------

export const metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: CONFIG.appName,
  },
  icons: [
    {
      rel: 'icon',
      url: `${CONFIG.assetsDir}favicon.ico`,
      sizes: '48x48',
      type: 'image/x-icon',
    },
    {
      rel: 'icon',
      url: `${CONFIG.assetsDir}favicon-512.png`,
      sizes: '512x512',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
      sizes: '512x512',
    },
  ],
};

async function getAppConfig() {
  if (CONFIG.isStaticExport) {
    return {
      lang: 'en',
      i18nLang: undefined,
      cookieSettings: undefined,
      dir: defaultSettings.direction,
    };
  } else {
    const [lang, settings] = await Promise.all([detectLanguage(), detectSettings()]);

    return {
      lang,
      i18nLang: lang,
      cookieSettings: settings,
      dir: settings.direction,
    };
  }
}

// ----------------------------------------------------------------------

export default async function RootLayout({ children }) {
  const appConfig = await getAppConfig();

  return (
    <html lang={appConfig.lang} dir={appConfig.dir} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <InitColorSchemeScript
          modeStorageKey={themeConfig.modeStorageKey}
          attribute={themeConfig.cssVariables.colorSchemeSelector}
          defaultMode={themeConfig.defaultMode}
        />

        <I18nProvider lang={appConfig.i18nLang}>
          <ReduxProvider>
            <JwtAuthProvider>
              <SettingsProvider
                cookieSettings={appConfig.cookieSettings}
                defaultSettings={defaultSettings}
              >
                <LocalizationProvider>
                  <AppRouterCacheProvider options={{ key: 'css', enableCssLayer: true }}>
                    <GlobalStyles styles="@layer mui, components, utilities;" />
                    <ThemeProvider
                      modeStorageKey={themeConfig.modeStorageKey}
                      defaultMode={themeConfig.defaultMode}
                    >
                      <MotionLazy>
                        <Snackbar />
                        <ProgressBar />
                        <SettingsDrawer defaultSettings={defaultSettings} />
                        {children}
                      </MotionLazy>
                    </ThemeProvider>
                  </AppRouterCacheProvider>
                </LocalizationProvider>
              </SettingsProvider>
            </JwtAuthProvider>
          </ReduxProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

