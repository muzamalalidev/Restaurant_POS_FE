import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';

import { varFade, MotionViewport } from 'src/components/animate';

import { SectionTitle } from './components/section-title';
import { FloatLine, FloatXIcon, FloatPlusIcon } from './components/svg-elements';

// ----------------------------------------------------------------------

const renderLines = () => (
  <>
    <FloatPlusIcon sx={{ top: 120, left: 72 }} />
    <FloatXIcon sx={{ bottom: 120, left: 72 }} />
    <FloatLine sx={{ top: 128, left: 0 }} />
    <FloatLine sx={{ bottom: 128, left: 0 }} />
    <FloatLine vertical sx={{ top: 0, left: 80 }} />
  </>
);

export function HomeWorthCTA({ sx, ...other }) {
  const renderDescription = () => (
    <SectionTitle
      caption="Get Started"
      title="Start building"
      txtGradient="today"
      description="Everything you need to create a modern web application. Components, layouts, and pages ready to customize for your project."
      sx={{
        mb: { xs: 5, md: 8 },
        textAlign: 'center',
        maxWidth: 720,
        mx: 'auto',
      }}
    />
  );

  const renderSearchBar = () => null;

  const renderFeatures = () => (
    <Box
      component={m.div}
      variants={varFade('inUp', { distance: 24 })}
      sx={{ mt: { xs: 6, md: 8 } }}
    >
      <Stack
        direction="row"
        spacing={4}
        sx={{
          typography: 'body2',
          color: 'text.secondary',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: { xs: 2, sm: 4 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'success.main',
            }}
          />
          Modern Components
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'success.main',
            }}
          />
          Responsive Design
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'success.main',
            }}
          />
          Dark Mode Support
        </Box>
      </Stack>
    </Box>
  );

  return (
    <Box
      component="section"
      sx={[
        {
          overflow: 'hidden',
          position: 'relative',
          py: { xs: 10, md: 15 },
          bgcolor: 'background.neutral',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <MotionViewport>
        {renderLines()}

        <Container sx={{ position: 'relative', zIndex: 9 }}>
          <Stack spacing={{ xs: 5, md: 8 }} sx={{ alignItems: 'center' }}>
            {renderDescription()}
            {renderSearchBar()}
            {renderFeatures()}
          </Stack>
        </Container>
      </MotionViewport>
    </Box>
  );
}
