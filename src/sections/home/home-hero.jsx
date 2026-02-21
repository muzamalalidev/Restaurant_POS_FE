import { useRef, useState } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';

import Box from '@mui/material/Box';

import { HomeHeroSideTitle } from './home-hero-side-title';

// ----------------------------------------------------------------------

const mdKey = 'md';

export function HomeHero({ sx, ...other }) {
  const sideTitleBgVariant = 'ai-assistant-strong';
  const scrollProgress = useScrollPercent();

  return (
    <Box
      ref={scrollProgress.elementRef}
      component="section"
      sx={[
        (theme) => ({
          overflow: 'hidden',
          position: 'relative',
          [theme.breakpoints.up(mdKey)]: {
            minHeight: 760,
            height: '100vh',
            maxHeight: 1440,
            display: 'block',
            mt: 'calc(var(--layout-header-desktop-height) * -1)',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        sx={[
          (theme) => ({
            width: 1,
            display: 'flex',
            position: 'relative',
            flexDirection: 'column',
            [theme.breakpoints.up(mdKey)]: {
              height: 1,
              position: 'relative',
              maxHeight: 'inherit',
            },
          }),
        ]}
      >
        <HomeHeroSideTitle bgVariant={sideTitleBgVariant} />
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

function useScrollPercent() {
  const elementRef = useRef(null);

  const { scrollY } = useScroll();

  const [percent, setPercent] = useState(0);

  useMotionValueEvent(scrollY, 'change', (scrollHeight) => {
    let heroHeight = 0;

    if (elementRef.current) {
      heroHeight = elementRef.current.offsetHeight;
    }

    const scrollPercent = Math.floor((scrollHeight / heroHeight) * 100);

    if (scrollPercent >= 100) {
      setPercent(100);
    } else {
      setPercent(Math.floor(scrollPercent));
    }
  });

  return { elementRef, percent, scrollY };
}
