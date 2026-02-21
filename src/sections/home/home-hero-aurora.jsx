'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { m, AnimatePresence } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

import { varFade, MotionContainer } from 'src/components/animate';
import { CompanyLogosMarquee } from 'src/components/company-logos-marquee';

// ----------------------------------------------------------------------

const CYCLING_WORDS = ['Looks Like', 'Can Build', 'Starts With'];
const CYCLE_INTERVAL_MS = 3200;

const motionProps = {
  variants: varFade('inUp', { distance: 24 }),
};

const motionPropsDelayed = {
  variants: varFade('inUp', {
    distance: 24,
    transitionIn: { duration: 0.8, delay: 0.15 },
  }),
};

const motionPropsMore = {
  variants: varFade('inUp', {
    distance: 24,
    transitionIn: { duration: 0.8, delay: 0.3 },
  }),
};

const motionPropsLate = {
  variants: varFade('inUp', {
    distance: 20,
    transitionIn: { duration: 0.9, delay: 0.5 },
  }),
};

// ----------------------------------------------------------------------
// AURORA ANIMATED BACKGROUND — Pure CSS keyframe blobs
// ----------------------------------------------------------------------

function AuroraBackground() {
  return (
    <Box
      sx={(theme) => ({
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
        backgroundColor:
          theme.palette.mode === 'dark' ? '#060611' : '#F7FAFF',
        '@keyframes auroraShift1': {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '25%': { transform: 'translate(4%, -6%) scale(1.08)' },
          '50%': { transform: 'translate(-2%, 4%) scale(0.96)' },
          '75%': { transform: 'translate(5%, 2%) scale(1.04)' },
          '100%': { transform: 'translate(0%, 0%) scale(1)' },
        },
        '@keyframes auroraShift2': {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '25%': { transform: 'translate(-5%, 3%) scale(1.06)' },
          '50%': { transform: 'translate(3%, -5%) scale(1.1)' },
          '75%': { transform: 'translate(-3%, -2%) scale(0.94)' },
          '100%': { transform: 'translate(0%, 0%) scale(1)' },
        },
        '@keyframes auroraShift3': {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '25%': { transform: 'translate(6%, 4%) scale(0.92)' },
          '50%': { transform: 'translate(-4%, -3%) scale(1.08)' },
          '75%': { transform: 'translate(2%, 6%) scale(1.02)' },
          '100%': { transform: 'translate(0%, 0%) scale(1)' },
        },
        '@keyframes auroraShift4': {
          '0%': { transform: 'translate(0%, 0%) scale(1) rotate(0deg)' },
          '33%': { transform: 'translate(-3%, 5%) scale(1.1) rotate(2deg)' },
          '66%': { transform: 'translate(4%, -4%) scale(0.95) rotate(-1deg)' },
          '100%': { transform: 'translate(0%, 0%) scale(1) rotate(0deg)' },
        },
      })}
    >
      {/* Blob 1 — Primary blue, top-left anchor */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          top: '-12%',
          left: '-8%',
          width: { xs: '70%', md: '55%' },
          height: { xs: '50%', md: '55%' },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${
            theme.palette.mode === 'dark'
              ? varAlpha(theme.vars.palette.primary.mainChannel, 0.28)
              : 'rgba(7, 141, 238, 0.2)'
          } 0%, transparent 70%)`,
          filter: { xs: 'blur(60px)', md: 'blur(100px)' },
          animation: 'auroraShift1 14s ease-in-out infinite',
          willChange: 'transform',
        })}
      />

      {/* Blob 2 — Teal/green, right side */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          top: '15%',
          right: '-12%',
          width: { xs: '60%', md: '48%' },
          height: { xs: '45%', md: '50%' },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${
            theme.palette.mode === 'dark'
              ? varAlpha(theme.vars.palette.success.mainChannel, 0.2)
              : 'rgba(0, 184, 130, 0.14)'
          } 0%, transparent 70%)`,
          filter: { xs: 'blur(60px)', md: 'blur(100px)' },
          animation: 'auroraShift2 17s ease-in-out infinite',
          willChange: 'transform',
        })}
      />

      {/* Blob 3 — Purple/violet, bottom-center */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          bottom: '-18%',
          left: '15%',
          width: { xs: '65%', md: '52%' },
          height: { xs: '48%', md: '52%' },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${
            theme.palette.mode === 'dark'
              ? 'rgba(118, 80, 220, 0.18)'
              : 'rgba(118, 53, 220, 0.09)'
          } 0%, transparent 70%)`,
          filter: { xs: 'blur(60px)', md: 'blur(100px)' },
          animation: 'auroraShift3 20s ease-in-out infinite',
          willChange: 'transform',
        })}
      />

      {/* Blob 4 — Faint blue, center, creates depth */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          top: '35%',
          left: '30%',
          width: { xs: '50%', md: '38%' },
          height: { xs: '40%', md: '38%' },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${
            theme.palette.mode === 'dark'
              ? varAlpha(theme.vars.palette.primary.mainChannel, 0.1)
              : 'rgba(7, 141, 238, 0.06)'
          } 0%, transparent 70%)`,
          filter: { xs: 'blur(80px)', md: 'blur(120px)' },
          animation: 'auroraShift4 22s ease-in-out infinite',
          willChange: 'transform',
        })}
      />

      {/* Subtle noise texture overlay for depth */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------
// WORD CYCLING HOOK
// ----------------------------------------------------------------------

function useCyclingWord(words, intervalMs) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [words.length, intervalMs]);

  return { word: words[index], index };
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export function HomeHeroAurora({ sx, ...other }) {
  const { word: currentWord, index: wordIndex } = useCyclingWord(
    CYCLING_WORDS,
    CYCLE_INTERVAL_MS
  );

  const illustrationSrc = `${CONFIG.assetsDir}assets/illustrations/illustration-dashboard.webp`;

  // ---- Render: Pill Badge ----
  const renderPillBadge = () => (
    <Box
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        px: { xs: theme.spacing(1.5), sm: theme.spacing(2) },
        py: { xs: theme.spacing(0.6), sm: theme.spacing(0.75) },
        borderRadius: 999,
        backgroundColor:
          theme.palette.mode === 'dark'
            ? varAlpha(theme.vars.palette.background.defaultChannel, 0.5)
            : 'rgba(255, 255, 255, 0.75)',
        border: `1px solid ${varAlpha(
          theme.vars.palette.primary.mainChannel,
          theme.palette.mode === 'dark' ? 0.2 : 0.12
        )}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.06)',
      })}
    >
      {/* Pulsing green dot */}
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: '#00B831',
          boxShadow: '0 0 0 3px rgba(0, 184, 49, 0.2)',
          animation: 'dotPulse 2.4s ease-in-out infinite',
          '@keyframes dotPulse': {
            '0%, 100%': { boxShadow: '0 0 0 3px rgba(0, 184, 49, 0.2)' },
            '50%': { boxShadow: '0 0 0 7px rgba(0, 184, 49, 0.08)' },
          },
        }}
      />
      <Typography
        variant="body2"
        sx={(theme) => ({
          fontWeight: 600,
          fontSize: theme.typography.pxToRem(13),
          letterSpacing: '-0.01em',
          color: theme.vars.palette.text.primary,
        })}
      >
               Professional Dashboard Theme
      </Typography>
    </Box>
  );

  // ---- Render: Headline with cycling word ----
  const renderHeadline = () => (
    <Typography
      component="h1"
      sx={(theme) => ({
        my: 0,
        mx: 'auto',
        textAlign: 'center',
        maxWidth: 920,
        fontFamily: theme.typography.fontFamily,
        fontSize: {
          xs: theme.typography.pxToRem(38),
          sm: theme.typography.pxToRem(48),
          md: theme.typography.pxToRem(60),
          lg: theme.typography.pxToRem(72),
        },
        lineHeight: { xs: 1.1, md: 1.08 },
        letterSpacing: '-0.03em',
        fontWeight: 700,
        color: theme.vars.palette.text.primary,
      })}
    >
             <Box component="span" sx={{ display: 'block' }}>
               See What Your App
             </Box>
      <Box
        component="span"
        sx={{
          display: 'block',
          mt: { xs: 0.5, md: 1 },
          position: 'relative',
        }}
      >
        {/* Fixed-width container for cycling word to prevent layout shift */}
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            minWidth: { xs: 180, sm: 240, md: 320, lg: 380 },
            textAlign: 'right',
          }}
        >
          <AnimatePresence mode="wait">
            <m.span
              key={wordIndex}
              initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -24, opacity: 0, filter: 'blur(6px)' }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ display: 'inline-block' }}
            >
              <Box
                component="span"
                sx={(theme) => ({
                  backgroundImage: `linear-gradient(135deg, ${theme.vars.palette.primary.main} 0%, ${
                    theme.palette.mode === 'dark'
                      ? theme.vars.palette.primary.light
                      : theme.vars.palette.info.main
                  } 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                })}
              >
                {currentWord}
              </Box>
            </m.span>
          </AnimatePresence>
        </Box>{' '}
        <Box component="span">Today</Box>
      </Box>
    </Typography>
  );

  // ---- Render: Subheadline ----
  const renderSubheadline = () => (
    <Typography
      component="p"
      sx={(theme) => ({
        mx: 'auto',
        maxWidth: 560,
        textAlign: 'center',
        fontSize: {
          xs: theme.typography.pxToRem(16),
          md: theme.typography.pxToRem(19),
        },
        lineHeight: 1.65,
        fontWeight: 500,
        color: varAlpha(theme.vars.palette.text.primaryChannel, 0.65),
      })}
    >
             Modern components, responsive layouts, and beautiful design — everything
             you need to build.
    </Typography>
  );

  // ---- Render: Glass-morphism Search Card ----
  const renderGlassSearchCard = () => (
    <Box
      sx={(theme) => ({
        width: '100%',
        maxWidth: 780,
        mx: 'auto',
        p: { xs: theme.spacing(1.5), sm: theme.spacing(2), md: theme.spacing(2.5) },
        borderRadius: 3,
        // Glass-morphism
        backgroundColor:
          theme.palette.mode === 'dark'
            ? varAlpha(theme.vars.palette.background.defaultChannel, 0.35)
            : 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${
          theme.palette.mode === 'dark'
            ? varAlpha(theme.vars.palette.common.whiteChannel, 0.08)
            : 'rgba(255, 255, 255, 0.6)'
        }`,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 24px 64px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)'
            : '0 24px 64px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        transition: theme.transitions.create(['box-shadow', 'border-color'], {
          duration: theme.transitions.duration.standard,
        }),
        '&:hover': {
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 24px 80px rgba(7, 141, 238, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              : '0 24px 80px rgba(7, 141, 238, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
          borderColor:
            theme.palette.mode === 'dark'
              ? varAlpha(theme.vars.palette.primary.mainChannel, 0.15)
              : varAlpha(theme.vars.palette.primary.mainChannel, 0.12),
        },
      })}
    >
      {/* Search bar removed - business-specific component */}
    </Box>
  );

  // ---- Render: Logos Marquee ----
  const renderLogosMarquee = () => (
    <CompanyLogosMarquee
      logoHeight={28}
      speed={36}
      sx={{ mx: 'auto', maxWidth: 680 }}
      viewportSx={{
        maskImage:
          'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
      }}
    />
  );

  // ---- Render: House Illustration (subtle, blended) ----
  const renderHouseIllustration = () => (
    <Box
      sx={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        zIndex: 1,
        pointerEvents: 'none',
        width: { xs: '85%', md: '48%' },
        maxWidth: 720,
        opacity: { xs: 0.06, md: 0.12 },
        maskImage:
          'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 75%)',
        WebkitMaskImage:
          'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 75%)',
        transform: 'translateX(10%)',
      }}
    >
      <MotionContainer>
        <m.div
          {...{
            variants: varFade('inUp', {
              distance: 60,
              transitionIn: { duration: 1.2, delay: 0.6 },
            }),
          }}
        >
          <Image
            src={illustrationSrc}
            alt="Modern home illustration"
            width={1400}
            height={800}
            style={{ width: '100%', height: 'auto' }}
          />
        </m.div>
      </MotionContainer>
    </Box>
  );

  // ---- Main Return ----
  return (
    <Box
      component="section"
      sx={[
        (theme) => ({
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - var(--layout-header-mobile-height))',
          [theme.breakpoints.up('md')]: {
            mt: 'calc(var(--layout-header-desktop-height) * -1)',
            minHeight: 'calc(100vh + var(--layout-header-desktop-height))',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* Animated aurora background */}
      <AuroraBackground />

      {/* Main content — centered vertically and horizontally */}
      <Container
        maxWidth={false}
        component={MotionContainer}
        sx={(theme) => ({
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '1 1 auto',
          maxWidth: 1200,
          px: { xs: 2, md: 3 },
          pt: { xs: 12, md: 0 },
          pb: { xs: 4, md: 0 },
          [theme.breakpoints.up('md')]: {
            py: 'var(--layout-header-desktop-height)',
          },
        })}
      >
        <Stack
          spacing={{ xs: 2.5, md: 3 }}
          sx={{ textAlign: 'center', alignItems: 'center', width: '100%' }}
        >
          {/* 1. Pill badge */}
          <m.div {...motionProps}>{renderPillBadge()}</m.div>

          {/* 2. Headline with word cycling */}
          <m.div {...motionProps}>{renderHeadline()}</m.div>

          {/* 3. Subheadline */}
          <m.div {...motionPropsDelayed}>{renderSubheadline()}</m.div>

          {/* 4. Glass search card */}
          <m.div {...motionPropsMore} style={{ width: '100%' }}>
            {renderGlassSearchCard()}
          </m.div>

          {/* 5. Logos marquee */}
          <m.div {...motionPropsLate} style={{ width: '100%' }}>
            {renderLogosMarquee()}
          </m.div>
        </Stack>
      </Container>

      {/* House illustration — subtle, blended into aurora */}
      {renderHouseIllustration()}
    </Box>
  );
}

export default HomeHeroAurora;
