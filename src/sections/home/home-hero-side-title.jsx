'use client';

import Image from 'next/image';
import { m } from 'framer-motion';
import { useMemo, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import GlobalStyles from '@mui/material/GlobalStyles';
import DialogContent from '@mui/material/DialogContent';
// (No external heading font; use theme typography like other home heroes)

import { CONFIG } from 'src/global-config';

import { varFade, MotionContainer } from 'src/components/animate';
import { CompanyLogosMarquee } from 'src/components/company-logos-marquee';

const HERO_TEXT_DARK = '#0B0B0F';

const motionProps = {
  variants: varFade('inUp', { distance: 24 }),
};

const motionPropsDelayed = {
  variants: varFade('inUp', {
    distance: 24,
    transitionIn: {
      duration: 0.8,
      delay: 0.2,
    },
  }),
};

const motionPropsImage = {
  variants: varFade('inRight', { distance: 200 }),
};

export function HomeHeroSideTitle({ sx, bgVariant = 'gradient', ...other }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [youtubeId] = useState('dQw4w9WgXcQ');

  const illustrationSrc = `${CONFIG.assetsDir}assets/illustrations/illustration-dashboard.webp`;

    const subtitle = useMemo(() => 'Modern, Fast, Beautiful', []);

  const renderAnnouncement = () => (
    <m.div {...motionProps}>
      <Box
        sx={(theme) => ({
          display: 'inline-flex',
          alignItems: 'center',
          gap: theme.spacing(1.0),
          pl: theme.spacing(1.0),
          pr: { xs: theme.spacing(1.25), sm: theme.spacing(1.75) },
          py: { xs: theme.spacing(0.45), sm: theme.spacing(0.5) },
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(12px)',
          color: HERO_TEXT_DARK,
          fontFamily: 'Gordita, inherit',
          fontWeight: 600,
          mb: { xs: theme.spacing(2.5), md: theme.spacing(3) },
        })}
      >
        <Box
          sx={{
            width: { xs: 10, sm: 12 },
            height: { xs: 10, sm: 12 },
            borderRadius: '50%',
            backgroundColor: 'rgb(0, 184, 49)',
            boxShadow: '0 0 8px 2px rgba(0, 184, 49, 0.3)',
          }}
        />

        <Typography
          component="span"
          sx={(theme) => ({
            fontSize: { xs: theme.typography.pxToRem(13), sm: theme.typography.pxToRem(14) },
            letterSpacing: '0.005em',
            lineHeight: 1.4,
            color: 'rgba(11, 11, 15, 0.75)',
          })}
        >
               Launch your next project today
        </Typography>
      </Box>
    </m.div>
  );

  return (
    <Box
      component="section"
      sx={[
        (theme) => {
          const aiGradientLight = `
              radial-gradient(800px 500px at 15% 75%, rgba(160, 202, 255, 0.08), transparent 70%),
              radial-gradient(700px 400px at 85% 80%, rgba(130, 180, 255, 0.06), transparent 65%),
              radial-gradient(600px 400px at 50% 90%, rgba(180, 220, 255, 0.05), transparent 60%),
              linear-gradient(180deg, #FFFFFF 0%, rgba(247, 251, 255, 0.4) 70%, #FFFFFF 100%)
            `;
          const aiGradientDark = `
              radial-gradient(800px 500px at 15% 75%, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.05)}, transparent 70%),
              radial-gradient(700px 400px at 85% 80%, ${varAlpha(theme.vars.palette.info.mainChannel, 0.04)}, transparent 65%),
              radial-gradient(600px 400px at 50% 90%, ${varAlpha(theme.vars.palette.success.mainChannel, 0.015)}, transparent 60%),
              linear-gradient(180deg, #141A21 0%, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.25)} 70%, #141A21 100%)
            `;
          const aiGradientStrongLight = `
              radial-gradient(800px 500px at 15% 75%, rgba(160, 202, 255, 0.18), transparent 70%),
              radial-gradient(700px 400px at 85% 80%, rgba(130, 180, 255, 0.14), transparent 65%),
              radial-gradient(600px 400px at 50% 90%, rgba(180, 220, 255, 0.12), transparent 60%),
              linear-gradient(180deg, #FFFFFF 0%, rgba(240, 248, 255, 0.8) 70%, #FFFFFF 100%)
            `;
          const aiGradientStrongDark = `
              radial-gradient(800px 500px at 15% 75%, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.12)}, transparent 70%),
              radial-gradient(700px 400px at 85% 80%, ${varAlpha(theme.vars.palette.info.mainChannel, 0.10)}, transparent 65%),
              radial-gradient(600px 400px at 50% 90%, ${varAlpha(theme.vars.palette.success.mainChannel, 0.06)}, transparent 60%),
              linear-gradient(180deg, #141A21 0%, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.6)} 70%, #141A21 100%)
            `;

          const isGradient = bgVariant === 'gradient';
          const isAI = bgVariant === 'ai-assistant';
          const isAIStrong = bgVariant === 'ai-assistant-strong';

          let background = theme.vars.palette.background.default;
          let backgroundSize = 'auto';
          if (isGradient) {
            background = [
              'linear-gradient(178.61deg, #D7F7FF 1.17%, #B3F0F9 98.81%)',
              'repeating-linear-gradient(to right, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 24.5%)',
            ].join(',');
            backgroundSize = 'auto, 24.5% 100%';
          } else if (isAI) {
            background = aiGradientLight;
          } else if (isAIStrong) {
            background = aiGradientStrongLight;
          }

          return {
            position: 'relative',
            background,
            backgroundSize,
            backgroundPosition: 'center, left top',
            overflow: 'hidden',
            minHeight: 'calc(100vh - var(--layout-header-mobile-height))',
            [theme.breakpoints.up('md')]: {
              mt: 'calc(var(--layout-header-desktop-height) * -1)',
              minHeight: 'calc(100vh + var(--layout-header-desktop-height))',
            },
            ...(isAI && theme.applyStyles('dark', { background: aiGradientDark })),
            ...(isAIStrong && theme.applyStyles('dark', { background: aiGradientStrongDark })),
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* Register Gordita locally for labels and UI to match template */}
      <GlobalStyles
        styles={`
          @font-face {
            font-family: 'Gordita';
            src: url('/fonts/gordita/Gordita-Regular.woff2') format('woff2');
            font-weight: 400;
            font-style: normal;
            font-display: swap;
          }
          @font-face {
            font-family: 'Gordita';
            src: url('/fonts/gordita/Gordita-Bold.woff2') format('woff2');
            font-weight: 700;
            font-style: normal;
            font-display: swap;
          }
        `}
      />

      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <Container sx={{ position: 'relative', zIndex: 2 }}>
          <Box
            component={MotionContainer}
            sx={[
              (theme) => ({
                position: 'relative',
                pt: { xs: 12, md: 8 },
                pb: { xs: 4, md: 0 },
                [theme.breakpoints.up('md')]: {
                  minHeight: 'calc(100vh + var(--layout-header-desktop-height))',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                },
              }),
            ]}
          >
            {/* Neutralize Grid's negative margins from spacing={3} so edge padding matches Home page */}
            <Box sx={{ px: 1.5 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={10} lg={9} xl={8}>
                  {renderAnnouncement()}

                  <m.div {...motionProps}>
                    <Typography
                      component="h1"
                      sx={(theme) => ({
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: 600,
                        color: theme.vars
                          ? theme.vars.palette.text.primary
                          : theme.palette.text.primary,
                        fontSize: { xs: '40px', md: '60px', lg: '88px' },
                        lineHeight: 1.05,
                        position: 'relative',
                        display: 'inline-block',
                      })}
                    >
                           <Box component="span" sx={{ display: 'block' }}>Build Something</Box>
                      <Box
                        component="span"
                        sx={(theme) => ({
                          position: 'relative',
                          display: 'inline-block',
                          color: theme.vars
                            ? theme.vars.palette.primary.main
                            : theme.palette.primary.main,
                        })}
                      >
                               Amazing Today
                      </Box>
                    </Typography>
                  </m.div>

                  <m.div {...motionProps}>
                    <Typography
                      sx={{
                        fontFamily: 'Gordita, inherit',
                        fontSize: { xs: 24, md: 32 },
                        color: 'text.primary',
                        pt: { xs: 2.5, md: 3 },
                        pb: 0, // Removed bottom padding since buttons are hidden (original: pb: { xs: 3, md: 4 })

                      }}
                    >
                      {subtitle}
                    </Typography>
                  </m.div>

                  {/* TODO: Uncomment this section when content/video is ready for production
                      Also restore subtitle padding: pb: { xs: 3, md: 4 } when uncommenting
                  <m.div {...motionProps}>
                    <Stack direction="row" spacing={3} flexWrap="wrap" alignItems="center">
                      <Button
                        component={Link}
                        href={paths.platform.tenantMasters.root}
                        variant="outlined"
                        sx={{
                          borderRadius: 1,
                          px: 3,
                          py: 1.25,
                          borderWidth: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Explore All listing
                      </Button>

                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <IconButton
                          aria-label="watch intro video"
                          onClick={handleWatch}
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: 'common.white',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>
                            ▶
                          </Box>
                        </IconButton>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                            }}
                          >
                            Watch
                          </Typography>
                          <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                            Intro video
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </m.div> */}
                </Grid>
              </Grid>
            </Box>

            {/* Replace buy/rent dropdown with our property search bar */}
            <Box sx={{ mt: { xs: 4, md: 6 }, px: 1.5 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={12} lg={10} xl={9} sx={{ width: '100%' }}>
                  <m.div {...motionProps}>
                    {/* Search bar removed - business-specific component */}
                  </m.div>
                </Grid>
                <Grid item xs={12} md={12} lg={10} xl={9}>
                  <m.div {...motionPropsDelayed}>
                    <CompanyLogosMarquee
                      logoHeight={30}
                      speed={32}
                      gap={6}
                      sx={{
                        textAlign: 'left',
                        mt: { xs: 3, md: 4 },
                      }}
                      viewportSx={{
                        maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 72%)',
                        WebkitMaskImage:
                          'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 52%, rgba(0,0,0,0) 72%)',
                      }}
                    />
                  </m.div>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Decorative & illustration assets */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {/* House illustration anchored bottom-right */}
        <MotionContainer>
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: { xs: '95%', md: '62%' },
              maxWidth: 980,
              transform: 'translateX(8%)',
            }}
          >
            <m.div {...motionPropsImage}>
              <Image
                src={illustrationSrc}
                alt="illustration"
                width={1400}
                height={800}
                style={{ width: '100%', height: 'auto' }}
              />
            </m.div>
          </Box>
        </MotionContainer>
        {/* Removed stripe shape to prevent black dot artifacts */}
        {/* Circular badge */}
        {/* <Box
          sx={{
            position: 'absolute',
            left: { xs: 16, md: 40 },
            bottom: { xs: 140, md: 180 },
            width: { xs: 70, md: 96 },
          }}
        >
          <Image
            src={badge01Src}
            alt="badge"
            width={160}
            height={160}
            style={{ width: '100%', height: 'auto' }}
          />
        </Box> */}
      </Box>

      {/* Video dialog with random YouTube ID */}
      <Dialog open={videoOpen} onClose={() => setVideoOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ position: 'relative', pt: '56.25%' }}>
            <Box
              component="iframe"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              sx={{ position: 'absolute', inset: 0, border: 0, width: '100%', height: '100%' }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default HomeHeroSideTitle;
