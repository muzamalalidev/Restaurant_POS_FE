'use client';

import { LazyMotion } from 'framer-motion';

// ----------------------------------------------------------------------

const loadFeaturesAsync = async () => import('src/components/animate/features').then((res) => res.default);

export function MotionLazy({ children }) {
  return (
    // Note: `strict` mode removed to allow third-party libraries (Sanity Studio)
    // that use `motion` components internally. Tree-shaking still works.
    // See: https://motion.dev/docs/react-lazy-motion
    <LazyMotion features={loadFeaturesAsync}>
      {children}
    </LazyMotion>
  );
}
