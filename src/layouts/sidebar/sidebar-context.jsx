'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'; // eslint-disable-line perfectionist/sort-named-imports

import { usePathname } from 'src/routes/hooks';
import { useSettingsContext } from 'src/components/settings';

// ----------------------------------------------------------------------

const SidebarContext = createContext(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

// Breakpoint constants
const MOBILE_MAX = 1024;
const MED_MIN = 1025;
const MED_MAX = 1200;

// ----------------------------------------------------------------------

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Ref for cleaning up the openPanel delay timer
  const panelTimerRef = useRef(null);

  const pathname = usePathname();
  const settings = useSettingsContext();
  const { navLayout } = settings.state;

  // Mini mode forces collapsed state
  const isMiniMode = navLayout === 'mini';

  // Close mobile drawer on route change (including overflow reset)
  useEffect(() => {
    setIsMobileOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  // Force collapsed state when in mini mode
  useEffect(() => {
    if (isMiniMode) {
      setIsCollapsed(true);
    }
  }, [isMiniMode]);

  // Single consolidated resize listener for all responsive behavior
  useEffect(() => {
    const inMediumRange = (w) => w >= MED_MIN && w <= MED_MAX;

    // Auto-collapse on mount if in medium range (but not if mini mode)
    if (typeof window !== 'undefined' && inMediumRange(window.innerWidth) && !isMiniMode) {
      setIsCollapsed(true);
    }

    let prevInMedRange = typeof window !== 'undefined' && inMediumRange(window.innerWidth);

    const handleResize = () => {
      const w = window.innerWidth;
      const nowInMedRange = inMediumRange(w);

      // Mini mode always stays collapsed
      if (isMiniMode) {
        setIsCollapsed(true);
        prevInMedRange = nowInMedRange;
        return;
      }

      // Entering medium range → auto-collapse
      if (nowInMedRange && !prevInMedRange) {
        setIsCollapsed(true);
      }

      // Leaving medium range toward mobile → reset collapse
      // (so mobile drawer won't inherit stale collapsed state)
      if (!nowInMedRange && prevInMedRange && w < MED_MIN) {
        setIsCollapsed(false);
      }

      // Crossed into desktop from mobile → close mobile drawer
      if (w > MOBILE_MAX) {
        setIsMobileOpen((prev) => {
          if (prev) document.body.style.overflow = '';
          return false;
        });
      }

      prevInMedRange = nowInMedRange;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMiniMode]);

  // ESC key closes mobile sidebar
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
        document.body.style.overflow = '';
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMobileOpen]);

  // Cleanup panel delay timer on unmount
  useEffect(() => () => clearTimeout(panelTimerRef.current), []);

  // Close panel when collapsing
  // Prevent toggle in mini mode
  const toggleCollapse = useCallback(() => {
    if (isMiniMode) return; // Mini mode is always collapsed
    if (isPanelOpen) setIsPanelOpen(false);
    setIsCollapsed((prev) => !prev);
  }, [isPanelOpen, isMiniMode]);

  // Open slide panel (auto-expand if collapsed)
  // Prevent expansion in mini mode
  const openPanel = useCallback(() => {
    if (isMiniMode) return; // Mini mode cannot expand
    if (isCollapsed) {
      setIsCollapsed(false);
      // Allow width transition to complete before opening panel
      clearTimeout(panelTimerRef.current);
      panelTimerRef.current = setTimeout(() => setIsPanelOpen(true), 550);
    } else {
      setIsPanelOpen(true);
    }
  }, [isCollapsed, isMiniMode]);

  const closePanel = useCallback(() => {
    clearTimeout(panelTimerRef.current);
    setIsPanelOpen(false);
  }, []);

  const openMobile = useCallback(() => {
    // Reset collapsed state so mobile drawer always opens full-width
    // (isCollapsed may be true from the 1025–1200px auto-collapse)
    setIsCollapsed(false);
    setIsMobileOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
    document.body.style.overflow = '';
  }, []);

  const value = useMemo(
    () => ({
      isCollapsed,
      toggleCollapse,
      isPanelOpen,
      openPanel,
      closePanel,
      isMobileOpen,
      openMobile,
      closeMobile,
    }),
    [isCollapsed, toggleCollapse, isPanelOpen, openPanel, closePanel, isMobileOpen, openMobile, closeMobile]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
