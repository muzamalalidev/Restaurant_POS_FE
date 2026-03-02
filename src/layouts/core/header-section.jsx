'use client';

import { mergeClasses } from 'minimal-shared/utils';
import { useScrollOffsetTop } from 'minimal-shared/hooks';

import AppBar from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';

import { BreadcrumbsPortalTarget } from 'src/components/custom-breadcrumbs/breadcrumbs-portal-target';

import { layoutClasses } from './classes';

// ----------------------------------------------------------------------

export function HeaderSection({
  sx,
  slots,
  slotProps,
  className,
  disableOffset,
  layoutQuery = 'md',
  ...other
}) {
  const { offsetTop: isOffset } = useScrollOffsetTop();

  return (
    <HeaderRoot
      position="sticky"
      color="transparent"
      isOffset={isOffset}
      disableOffset={disableOffset}
      data-offset={isOffset ? 'true' : 'false'}
      className={mergeClasses([layoutClasses.header, className])}
      sx={[
        (theme) => ({
          ...(isOffset && {
            '--color': `var(--offset-color, ${theme.vars.palette.text.primary})`,
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {slots?.topArea}

      <HeaderContainer layoutQuery={layoutQuery} {...slotProps?.container}>
        {slots?.leftArea}

        <HeaderCenterArea {...slotProps?.centerArea}>
          {slots?.centerArea ?? <BreadcrumbsPortalTarget />}
        </HeaderCenterArea>

        {slots?.rightArea}
      </HeaderContainer>

      {slots?.bottomArea}
    </HeaderRoot>
  );
}

// ----------------------------------------------------------------------

const HeaderRoot = styled(AppBar, {
  shouldForwardProp: (prop) =>
    !['isOffset', 'disableOffset', 'sx'].includes(prop),
})(({ isOffset, disableOffset, theme }) => {
  const pauseZindex = { top: -1 };

  const transition = theme.transitions.create(['opacity', 'visibility'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter,
  });

  const pseudoBase = {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    transition,
  };

  const showBg = !disableOffset && isOffset;

  return {
    zIndex: 'var(--layout-header-zIndex)',
    backgroundColor: 'transparent',
    ...(!disableOffset && {
      '&::before': {
        ...pseudoBase,
        zIndex: pauseZindex.top,
        opacity: showBg ? 1 : 0,
        visibility: showBg ? 'visible' : 'hidden',
        backgroundColor: showBg ? theme.vars.palette.background.paper : 'transparent',
        backdropFilter: showBg ? `blur(var(--layout-header-blur, 8px))` : 'none',
      },
    }),
  };
});

const HeaderContainer = styled(Container, {
  shouldForwardProp: (prop) => !['layoutQuery', 'sx'].includes(prop),
})(({ layoutQuery = 'md', theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: 'var(--color)',
  height: 'var(--layout-header-mobile-height)',
  [theme.breakpoints.up(layoutQuery)]: { height: 'var(--layout-header-desktop-height)' },
}));

const HeaderCenterArea = styled('div')(() => ({
  display: 'flex',
  flex: '1 1 auto',
  justifyContent: 'center',
}));
