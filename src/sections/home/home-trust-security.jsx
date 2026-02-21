import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { varScale, MotionViewport } from 'src/components/animate';

import { SectionTitle } from './components/section-title';
import { FloatLine, FloatDotIcon } from './components/svg-elements';

// ----------------------------------------------------------------------

const renderLines = () => (
  <>
    <Stack
      spacing={8}
      alignItems="center"
      sx={{
        top: 64,
        left: 80,
        zIndex: 2,
        bottom: 64,
        position: 'absolute',
        transform: 'translateX(-50%)',
        '& span': { position: 'static', opacity: 0.12 },
      }}
    >
      <FloatDotIcon />
      <FloatDotIcon sx={{ opacity: 0.24, width: 14, height: 14 }} />
      <Box sx={{ flexGrow: 1 }} />
      <FloatDotIcon sx={{ opacity: 0.24, width: 14, height: 14 }} />
      <FloatDotIcon />
    </Stack>

    <FloatLine vertical sx={{ top: 0, left: 80 }} />
  </>
);

const TRUST_FEATURES = [
  {
    icon: 'material-symbols:verified-user',
    title: 'Production-ready code',
    description: 'Built with best practices, clean architecture, and comprehensive testing',
  },
  {
    icon: 'material-symbols:speed',
    title: 'Optimized performance',
    description: 'Fast load times, efficient rendering, and minimal bundle size',
  },
  {
    icon: 'material-symbols:groups',
    title: 'Trusted by developers',
    description: 'Used by thousands of developers and teams worldwide',
  },
];

export function HomeTrustSecurity({ sx, ...other }) {
  const renderDescription = () => (
    <SectionTitle
      caption="Quality & Reliability"
      title="Built on quality and"
      txtGradient="best practices"
      description="Ship with confidence using a theme built on solid foundations. Clean code, comprehensive components, and proven patterns at every level."
      sx={{ textAlign: { xs: 'center', md: 'left' } }}
    />
  );

  const renderFeatures = () => (
    <Stack spacing={3}>
      {TRUST_FEATURES.map((feature, index) => (
        <Box
          key={feature.title}
          component={m.div}
          variants={{
            ...varScale('in'),
            initial: { scale: 0.8, opacity: 0 },
            animate: { scale: 1, opacity: 1, transition: { delay: index * 0.1 } },
          }}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.neutral',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            transition: (theme) =>
              theme.transitions.create(['box-shadow', 'transform'], {
                duration: theme.transitions.duration.shorter,
              }),
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: (theme) => theme.customShadows.z20,
            },
          }}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                mt: 0.5,
                width: 48,
                height: 48,
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.contrastText',
                flexShrink: 0,
              }}
            >
              <Iconify icon={feature.icon} width={24} />
            </Box>

            <Stack spacing={1}>
              <Typography variant="h6" component="h3">
                {feature.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {feature.description}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      ))}
    </Stack>
  );

  const renderIcon = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: { xs: 200, md: 300 },
        height: { xs: 200, md: 300 },
        mx: 'auto',
        borderRadius: '50%',
        bgcolor: 'background.neutral',
        border: (theme) => `2px solid ${theme.palette.divider}`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          borderRadius: '50%',
          border: (theme) => `1px solid ${theme.palette.primary.main}`,
          opacity: 0.3,
        },
      }}
    >
      <Box
        component={m.div}
        variants={{
          ...varScale('in'),
          initial: { scale: 0.8, opacity: 0, rotate: -10 },
          animate: { scale: 1, opacity: 1, rotate: 0 },
        }}
        sx={{
          width: { xs: 120, md: 160 },
          height: { xs: 120, md: 160 },
          borderRadius: 2,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.contrastText',
          boxShadow: (theme) => theme.customShadows.z20,
        }}
      >
        <Iconify icon="material-symbols:lock-outline" width={{ xs: 60, md: 80 }} />
      </Box>
    </Box>
  );

  return (
    <Box
      component="section"
      sx={[{ pt: 10, position: 'relative' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <MotionViewport>
        {renderLines()}

        <Container>
          <Grid container spacing={{ xs: 5, md: 8 }}>
            <Grid size={{ xs: 12, md: 6, lg: 5 }}>
              {renderDescription()}
              <Box sx={{ mt: 4 }}>{renderFeatures()}</Box>
            </Grid>

            <Grid
              sx={{
                textAlign: { xs: 'center', md: 'right' },
                display: 'flex',
                alignItems: 'center',
              }}
              size={{ xs: 12, md: 6, lg: 7 }}
            >
              {renderIcon()}
            </Grid>
          </Grid>
        </Container>
      </MotionViewport>
    </Box>
  );
}
