import { styled } from '@mui/material/styles';

// ----------------------------------------------------------------------

// Default styles (for in-page rendering - fallback when no portal)

export const BreadcrumbsRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

export const BreadcrumbsHeading = styled('h6')(({ theme }) => ({
  ...theme.typography.h4,
  margin: 0,
  padding: 0,
  display: 'inline-flex',
}));

export const BreadcrumbsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  alignItems: 'flex-start',
  justifyContent: 'flex-end',
}));

export const BreadcrumbsContent = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: '1 1 auto',
  gap: theme.spacing(2),
  flexDirection: 'column',
}));

export const BreadcrumbsSeparator = styled('span')(({ theme }) => ({
  width: 4,
  height: 4,
  borderRadius: '50%',
  backgroundColor: theme.vars.palette.text.disabled,
}));

// ----------------------------------------------------------------------

// Header styles (for portal rendering in navbar)
// Desktop: Dashboard / Products / **Current Page** ... [Actions]
// Mobile: Products / **Page** ... [Actions] (condensed)

export const BreadcrumbsHeaderRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flex: '1 1 auto',
  minWidth: 0,
  height: '100%',
  gap: theme.spacing(1),
  paddingLeft: theme.spacing(1),
  [theme.breakpoints.up('md')]: {
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(2),
  },
}));

export const BreadcrumbsHeaderNav = styled('nav')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  minWidth: 0,
  flex: '1 1 auto',
  overflow: 'hidden',
  [theme.breakpoints.up('md')]: {
    gap: theme.spacing(0.75),
    flex: '0 1 auto',
    overflow: 'visible',
  },
}));

export const BreadcrumbsHeaderSlash = styled('span')(({ theme }) => ({
  ...theme.typography.body2,
  color: theme.vars.palette.text.disabled,
  fontWeight: 400,
  userSelect: 'none',
  flexShrink: 0,
  fontSize: '0.8125rem',
  [theme.breakpoints.up('md')]: {
    fontSize: '0.875rem',
  },
}));

export const BreadcrumbsHeaderHeading = styled('h1')(({ theme }) => ({
  margin: 0,
  padding: 0,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: theme.vars.palette.text.primary,
  // Mobile styles
  fontSize: '0.875rem',
  maxWidth: '150px',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '220px',
  },
  // Desktop styles
  [theme.breakpoints.up('md')]: {
    ...theme.typography.subtitle1,
    fontWeight: 700,
    maxWidth: 'none',
  },
}));

export const BreadcrumbsHeaderActions = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginLeft: 'auto',
  flexShrink: 0,
  [theme.breakpoints.up('md')]: {
    gap: theme.spacing(1),
  },
}));
