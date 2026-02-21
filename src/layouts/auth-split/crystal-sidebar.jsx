'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';

import { Logo } from 'src/components/logo';

// Theme gradient constants
const THEME_GRADIENT = 'linear-gradient(89.58deg, #3186FF 0.28%, #346BF0 44.45%, #4EA0FF 99.55%)';
const FONT_FAMILY = '"Outfit", sans-serif';

// ----------------------------------------------------------------------

export function CrystalSidebar({ layoutQuery = 'md' }) {
  return (
    <Box
      sx={{
        display: { xs: 'none', [layoutQuery]: 'flex' },
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
        borderRight: '1px solid rgba(255,255,255,0.8)',
        flexDirection: 'column',
        fontFamily: FONT_FAMILY,
        overflow: 'visible',
        zIndex: 10,
      }}
    >
      {/* Subtle Noise Texture */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.3,
          backgroundImage: 'url("/assets/background/noise.svg")',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: 'inherit',
        }}
      />

      {/* Background Blobs (Clipped inside) */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <Box
          sx={{
            position: 'absolute',
            top: '-15%',
            right: '-15%',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(49,134,255,0.15) 0%, rgba(255,255,255,0) 70%)',
            filter: 'blur(60px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(78,160,255,0.12) 0%, rgba(255,255,255,0) 70%)',
            filter: 'blur(80px)',
          }}
        />
      </Box>

      {/* ============ TOP LEFT: Logo ============ */}
      <Box sx={{ p: 4, position: 'relative', zIndex: 10 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
          <Logo
            sx={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& img, & svg': { width: 36, height: 36 },
            }}
          />
          <Typography
            component={RouterLink}
            href="/"
            sx={(theme) => ({
              fontSize: '1.5rem', // Match variant h4 approximately
              fontWeight: 800,
              fontFamily: theme.typography.fontSecondaryFamily,
              color: '#1e293b',
              letterSpacing: '-0.01em',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
            })}
          >
            Minimal<Box component="span" sx={{ color: '#3186FF' }}> Dashboard</Box>
          </Typography>
        </Box>
      </Box>

      {/* ============ CENTER: Content Group (truly centered) ============ */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          px: 4,
          width: '100%',
        }}
      >
        {/* Text Block */}
        <Box sx={{ textAlign: 'center', maxWidth: 480, position: 'relative', zIndex: 20 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '1.75rem', lg: '2.25rem' }, // 36px
              fontWeight: 500,
              color: '#0f172a',
              lineHeight: 1.12, // 62.72/56 ratio
              letterSpacing: '-0.04em', // -2.24px at 56px
              mb: 2,
              fontFamily: FONT_FAMILY,
              textWrap: 'pretty',
            }}
          >
            Build faster,
            <br />
            <Box
              component="span"
              sx={{
                background: THEME_GRADIENT,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'inline',
              }}
            >
              ship with confidence.
            </Box>
          </Typography>
          <Typography
            sx={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#64748b',
              fontWeight: 400,
              fontFamily: FONT_FAMILY,
            }}
          >
            Modern components, responsive layouts, and beautiful design. All in one dashboard.
          </Typography>
        </Box>

        {/* Mascot + Speech Bubble Container */}
        <Box sx={{ position: 'relative', mt: 6 }}>

            {/* Speech Bubble - SVG Path Implementation */}
            <Box
              sx={{
                position: 'absolute',
                top: -10,
                right: -155,
                zIndex: 100,
                minWidth: 210,
                filter: 'drop-shadow(0 12px 32px rgba(49, 134, 255, 0.2))',
              }}
            >
              {/* SVG Shape & Border */}
              <Box
                component="svg"
                width="100%"
                height="100%"
                viewBox="0 0 210 70"
                preserveAspectRatio="none"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
              >
                <defs>
                  <linearGradient id="bubbleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3186FF" />
                    <stop offset="44%" stopColor="#346BF0" />
                    <stop offset="100%" stopColor="#4EA0FF" />
                  </linearGradient>
                </defs>
                {/*
                  Path draws:
                  1. Top-left arc start -> Top-right arc
                  2. Right side down -> Bottom-right arc
                  3. Bottom side left -> to just before corner
                  4. The TAIL (extends down-left)
                  5. Back up to left side
                  6. Close path
                */}
                <path
                  d="
                    M 20 2
                    H 194
                    A 16 16 0 0 1 210 18
                    V 52
                    A 16 16 0 0 1 194 68
                    H 20
                    L 0 84
                    L 2 52
                    V 18
                    A 16 16 0 0 1 18 2
                    Z
                  "
                  fill="#ffffff"
                  stroke="url(#bubbleGradient)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </Box>

              {/* Content */}
              <Box sx={{ position: 'relative', zIndex: 1, padding: '14px 20px 14px 24px' }}>
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#64748b',
                    fontFamily: FONT_FAMILY,
                    lineHeight: 1.4,
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Welcome back!
                  <br />
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 700,
                      color: '#3186FF',
                      fontSize: '0.9375rem',
                    }}
                  >
                    Let&apos;s get started.
                  </Box>
                </Typography>
              </Box>
            </Box>

          <Box
            component="img"
            src={`${CONFIG.assetsDir}assets/mascot/mascot-assistant-transparent.png`}
            alt="Minimal Dashboard Assistant"
            sx={{
              width: 300,
              height: 300,
              objectFit: 'contain',
              filter: 'drop-shadow(0 20px 30px rgba(49, 134, 255, 0.15)) brightness(1.05) contrast(1.1)',
            }}
          />
        </Box>
      </Box>

      {/* ============ BOTTOM: Aria AI Assistant Card ============ */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 10,
          px: 3,
        }}
      >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              maxWidth: 400,
            }}
          >
            {/* Vertical Gradient Divider */}
            <Box
              sx={{
                width: '1.5px',
                height: 48,
                borderRadius: '1px',
                background: 'linear-gradient(180deg, #93C5FD 0%, #60A5FA 100%)', // Middle ground blue
                flexShrink: 0,
              }}
            />

            {/* Text Content */}
            <Box>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#475569',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  fontFamily: FONT_FAMILY,
                }}
              >
                <Box component="span" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Minimal
                </Box>
                {' '}provides everything you need to build modern web applications with ease.
              </Typography>
            </Box>
          </Box>
      </Box>
    </Box>
  );
}
