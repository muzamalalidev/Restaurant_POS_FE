import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';

import { CONFIG } from 'src/global-config';

import { MotionContainer } from 'src/components/animate';

import { Dots, Lines, Texts, Circles, PlusIcon } from './hero-svg';

const PATTERN_IMAGE_URL = '/assets/background/pattern.svg';

// ----------------------------------------------------------------------

export function HeroBackground({
  sx,
  backgroundMode = 'video',
  overlayEnabled = true,
  videoPath = 'hero-background.mp4',
  imagePath,
  showBottomRightImage = false,
  imageGradientEnabled = true,
  ...other
}) {
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const strokeCount = 12;
  const effectiveMode = backgroundMode;
  const isVideoBackground = effectiveMode === 'video';
  const bottomOverlayHeight = '42%';

  return (
    <MotionContainer>
      <Box
        sx={[
          (theme) => ({
            '--stroke-dasharray': 3,
            '--stroke-spacing': '80px',
            /* line */
            '--hero-line-stroke-width': 1,
            '--hero-line-stroke-color': varAlpha(theme.vars.palette.grey['500Channel'], 0.32),
            ...theme.applyStyles('dark', {
              '--hero-line-stroke-color': varAlpha(theme.vars.palette.grey['600Channel'], 0.16),
            }),
            /* text */
            '--hero-text-stroke-width': 1,
            '--hero-text-stroke-color': varAlpha(theme.vars.palette.grey['500Channel'], 0.24),
            ...theme.applyStyles('dark', {
              '--hero-text-stroke-color': varAlpha(theme.vars.palette.grey['600Channel'], 0.12),
            }),
            /* circle */
            '--hero-circle-stroke-width': 1,
            '--hero-circle-stroke-color': varAlpha(theme.vars.palette.grey['500Channel'], 0.48),
            ...theme.applyStyles('dark', {
              '--hero-circle-stroke-color': varAlpha(theme.vars.palette.grey['600Channel'], 0.24),
            }),
            /* plus */
            '--hero-plus-stroke-color': theme.vars.palette.text.disabled,
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            position: 'absolute',
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {!isVideoBackground && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              overflow: 'hidden',
              zIndex: -3,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                background: 'linear-gradient(110deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.95) 40%, rgba(233,241,255,0.78) 68%, rgba(219,233,255,0.55) 82%, rgba(210,228,255,0.32) 100%)',
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.75) 55%, rgba(242,248,255,0.1) 78%, rgba(233,242,255,0) 100%)',
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: { xs: '100%', md: '80%' },
                borderRadius: 'inherit',
                backgroundImage: `url(${PATTERN_IMAGE_URL})`,
                backgroundRepeat: 'repeat',
                backgroundPosition: 'left top',
                backgroundSize: '19px auto',
                opacity: 0.32,
                mixBlendMode: 'multiply',
                maskImage:
                  'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 60%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage:
                  'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 60%, rgba(0,0,0,0) 100%)',
              }}
            />
          </Box>
        )}

        <Dots />

        {mdUp && <Texts />}

        <Box
          component={m.svg}
          xmlns="http://www.w3.org/2000/svg"
          width="1440"
          height="1080"
          fill="none"
          viewBox="0 0 1440 1080"
          initial="hidden"
          animate="visible"
          sx={[{ width: 1, height: 1 }]}
        >
          <defs>
            <radialGradient
              id="mask_gradient_id"
              cx="0"
              cy="0"
              r="1"
              gradientTransform="matrix(720 0 0 420 720 560)"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.08} />
            </radialGradient>

            <mask id="mask_id">
              <ellipse cx="50%" cy="50%" rx="50%" ry="36%" fill="url(#mask_gradient_id)" />
            </mask>
          </defs>

          <g mask="url(#mask_id)">
            <Circles />
            <PlusIcon />
            <Lines strokeCount={strokeCount} />
          </g>
        </Box>

        {/* Background media switcher: video or image */}
        {(backgroundMode ?? CONFIG.hero?.backgroundMode) === 'video' ? (
          <Box
            component={m.video}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
            src={`${CONFIG.assetsDir}assets/videos/${videoPath}`}
            sx={[
              (theme) => ({
                top: 0,
                left: 0,
                width: 1,
                height: 1,
                zIndex: -2,
                position: 'absolute',
                objectFit: 'cover',
                pointerEvents: 'none',
                backgroundColor: theme.vars.palette.background.default,
              }),
            ]}
          />
        ) : showBottomRightImage ? (
          // Special layout for AI Home 4 - gradient background with bottom-right positioned image
          <>
            <Box
              component={m.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              sx={[
                (theme) => ({
                  top: 0,
                  left: 0,
                  width: 1,
                  height: 1,
                  zIndex: -2,
                  position: 'absolute',
                  backgroundColor: theme.vars.palette.background.default,
                }),
              ]}
            />
            {/* House image positioned bottom-right with heavy crop */}
            <Box
              component={m.div}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              sx={{
                position: 'absolute',
                right: { xs: '-50%', md: '-50%' },
                bottom: 0,
                width: { xs: '160%', md: '120%' },
                maxWidth: 1400,
                zIndex: -1,
                pointerEvents: 'none',
              }}
            >
              <Box
                component="img"
                src={`${CONFIG.assetsDir}assets/background/home-images/${imagePath}`}
                alt="Modern home illustration"
                sx={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  transform: 'none',
                }}
              />
              {/* Heavy left white fade overlay for AI Home images (controllable) */}
              {imageGradientEnabled && (
                <Box
                  component={m.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '40%',
                    height: '100%',
                    background: (theme) =>
                      theme.vars.palette.mode === 'dark'
                        ? `linear-gradient(to right, ${theme.vars.palette.background.default} 0%, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.7)} 60%, transparent 100%)`
                        : `linear-gradient(to right, ${theme.vars.palette.background.default} 0%, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.7)} 60%, transparent 100%)`,
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />
              )}
            </Box>
          </>
        ) : (
          <Box
            component={m.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={[
              (theme) => ({
                top: 0,
                left: 0,
                width: 1,
                height: 1,
                zIndex: -2,
                position: 'absolute',
                backgroundImage: `url(${CONFIG.assetsDir}assets/background/home-images/${imagePath || 'home-hero-nosky-test-3.png'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }),
            ]}
          />
        )}

        {/* Optional dark overlay for readability (toggleable) - skip for bottom-right image layout */}
        {(overlayEnabled ?? CONFIG.hero?.overlayEnabled) && !showBottomRightImage && (
          <Box
            component={m.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={[
              (theme) => ({
                top: 0,
                left: 0,
                width: 1,
                height: 1,
                zIndex: -1.5,
                position: 'absolute',
                backgroundColor: 'rgba(0, 0, 0, 0)', // CHANGE THIS VALUE: 0.1=light, 0.5=dark
                ...theme.applyStyles('dark', {
                  backgroundColor: 'transparent',
                }),
              }),
            ]}
          />
        )}

        {/* Optional gradient overlay (toggleable) - skip for bottom-right image layout */}
        {(overlayEnabled ?? CONFIG.hero?.overlayEnabled) &&
          !showBottomRightImage &&
          (isVideoBackground ? (
            // Bottom-only overlay for video to avoid washing out the footage
            <Box
              component={m.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              sx={[
                (theme) => ({
                  ...theme.mixins.bgGradient({
                    images: [
                      `linear-gradient(0deg, ${varAlpha(
                        theme.vars.palette.background.defaultChannel,
                        0.72
                      )} 0%, ${varAlpha(
                        theme.vars.palette.background.defaultChannel,
                        0.48
                      )} 40%, ${varAlpha(theme.vars.palette.background.defaultChannel, 0)} 100%)`,
                    ],
                  }),
                  left: 0,
                  bottom: 0,
                  width: 1,
                  height: bottomOverlayHeight,
                  zIndex: -1,
                  position: 'absolute',
                  ...theme.applyStyles('dark', {
                    ...theme.mixins.bgGradient({
                      images: [
                        `linear-gradient(0deg, ${varAlpha(
                          theme.vars.palette.background.defaultChannel,
                          0.9
                        )} 0%, ${varAlpha(
                          theme.vars.palette.background.defaultChannel,
                          0.7
                        )} 40%, ${varAlpha(theme.vars.palette.background.defaultChannel, 0)} 100%)`,
                      ],
                    }),
                  }),
                }),
              ]}
            />
          ) : (
            // Full overlay for image backgrounds (keeps text readable)
            <Box
              component={m.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              sx={[
                (theme) => ({
                  ...theme.mixins.bgGradient({
                    images: [
                      `linear-gradient(180deg, ${varAlpha(
                        theme.vars.palette.background.defaultChannel,
                        0.4
                      )} 12%, ${varAlpha(
                        theme.vars.palette.background.defaultChannel,
                        0.2
                      )} 50%, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.85)} 88%)`,
                    ],
                  }),
                  top: 0,
                  left: 0,
                  width: 1,
                  height: 1,
                  zIndex: -1,
                  position: 'absolute',
                  ...theme.applyStyles('dark', {
                    ...theme.mixins.bgGradient({
                      images: [
                        `linear-gradient(180deg, ${varAlpha(
                          theme.vars.palette.background.defaultChannel,
                          0.9
                        )} 12%, ${varAlpha(
                          theme.vars.palette.background.defaultChannel,
                          0.7
                        )} 50%, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.9)} 88%)`,
                      ],
                    }),
                  }),
                }),
              ]}
            />
          ))}
      </Box>
    </MotionContainer>
  );
}
