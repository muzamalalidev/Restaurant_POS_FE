'use client';

import { m, useInView } from 'framer-motion';
import { useRef, useState, useEffect, isValidElement } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

// GSAP power2.out easing curve approximated for framer-motion
const power2Out = [0.25, 0.46, 0.45, 0.94];

export function RevealAnimation({
  children,
  duration = 0.6,
  delay = 0,
  offset = 60,
  instant = false,
  start = 'top 90%',
  direction = 'down',
  className,
  ...other
}) {
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Parse start string to determine viewport threshold
  // "top 90%" means element enters when its top is at 90% of viewport
  const getViewportThreshold = (startStr) => {
    if (startStr.includes('90%')) return 0.1; // Element enters when 10% visible
    if (startStr.includes('80%')) return 0.2; // Element enters when 20% visible
    if (startStr.includes('70%')) return 0.3;
    if (startStr.includes('97%')) return 0.03; // For very early triggers
    return 0.1; // Default
  };

  const threshold = getViewportThreshold(start);

  // Add rootMargin to prevent rapid threshold crossings
  // Negative margin makes it trigger slightly earlier, reducing flicker
  const inView = useInView(ref, {
    once: true,
    amount: threshold,
    margin: '-100px 0px', // Increased margin to trigger earlier and prevent flicker
  });

  // Track when animation completes to clean up willChange
  useEffect(() => {
    if ((instant || inView) && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
        if (ref.current) {
          // Remove willChange after animation completes for better performance
          ref.current.style.willChange = 'auto';
        }
      }, (duration + delay) * 1000 + 100); // Animation duration + delay + buffer

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [instant, inView, hasAnimated, duration, delay]);

  // Get direction offsets
  const getDirectionOffset = () => {
    switch (direction) {
      case 'up':
        return { x: 0, y: -offset };
      case 'down':
        return { x: 0, y: offset };
      case 'left':
        return { x: -offset, y: 0 };
      case 'right':
        return { x: offset, y: 0 };
      default:
        return { x: 0, y: offset };
    }
  };

  const directionOffset = getDirectionOffset();

  // Initial state: hidden with offset (removed blur for performance)
  // Using only transform and opacity - much more performant than filter blur
  const initial = {
    ...directionOffset,
    opacity: 0,
    // Removed filter blur - it's very expensive and causes flickering
    // If blur is needed, use backdrop-filter on a separate overlay element
  };

  // Animated state: visible, no offset
  const animate = instant || inView
    ? {
        x: 0,
        y: 0,
        opacity: 1,
      }
    : initial;

  if (!isValidElement(children)) {
    return null;
  }

  const motionProps = {
    initial,
    animate,
    transition: {
      duration,
      delay,
      ease: power2Out, // Match GSAP power2.out easing
    },
    ref,
  };

  // Wrap in motion Box for MUI components
  return (
    <Box
      component={m.div}
      {...motionProps}
      className={className}
      sx={{
        // CHROME OPTIMIZATION: Only apply GPU hints during animation, not permanently
        // This prevents Chrome from creating 132 permanent compositing layers
        ...((!hasAnimated && (instant || inView)) && {
          willChange: 'transform, opacity',
          // Only force GPU layer during animation - removed permanent translateZ(0)
        }),
        // Prevent flickering without forcing GPU layers
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        // Merge other sx props
        ...other?.sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}
