import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from 'src/components/iconify';
import { createNavItem, navItemStyles, navSectionClasses } from 'src/components/nav-section';

// ----------------------------------------------------------------------

export function NavItem({
  title,
  path,
  icon,
  description,
  /********/
  open,
  active,
  /********/
  subItem,
  hasChild,
  className,
  externalLink,
  ...other
}) {
  const navItem = createNavItem({ path, icon, hasChild, externalLink });

  const ownerState = { open, active, variant: !subItem ? 'rootItem' : 'subItem' };

  return (
    <ItemRoot
      disableRipple
      aria-label={title}
      {...ownerState}
      {...navItem.baseProps}
      className={mergeClasses([navSectionClasses.item.root, className], {
        [navSectionClasses.state.open]: open,
        [navSectionClasses.state.active]: active,
      })}
      {...other}
    >
      {icon && (
        <ItemIcon {...ownerState}>
          <Iconify icon={icon} width={24} />
        </ItemIcon>
      )}

      <ItemContent {...ownerState}>
        <ItemTitle {...ownerState}>{title}</ItemTitle>
        {description && <ItemDescription {...ownerState}>{description}</ItemDescription>}
      </ItemContent>

      {hasChild && <ItemArrow {...ownerState} icon="eva:arrow-ios-downward-fill" />}
    </ItemRoot>
  );
}

// ----------------------------------------------------------------------

const shouldForwardProp = (prop) => !['open', 'active', 'variant', 'sx'].includes(prop);

/**
 * @slot root
 */
const ItemRoot = styled(ButtonBase, { shouldForwardProp })(({ active, open, variant, theme }) => {
  const rootItemStyles = {
    ...(active && { color: theme.vars.palette.primary.main }),
  };

  const subItemStyles = {
    color: theme.vars.palette.text.primary,
    borderRadius: 15,
    padding: theme.spacing(1.5, 2),
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    border: '1px solid transparent',
    '&:hover': {
      color: theme.vars.palette.text.primary,
      backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
    },
    ...(active && {
      color: theme.vars.palette.text.primary,
      backgroundColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
      border: `1px solid ${varAlpha(theme.vars.palette.primary.mainChannel, 0.24)}`,
    }),
  };

  return {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing(0.75),
    textAlign: 'left',
    transition: theme.transitions.create(['color', 'background-color'], {
      duration: theme.transitions.duration.shorter,
    }),
    variants: [
      { props: { variant: 'rootItem' }, style: rootItemStyles },
      { props: { variant: 'subItem' }, style: subItemStyles },
    ],
  };
});

/**
 * @slot title
 */
const ItemTitle = styled('span', { shouldForwardProp })(({ theme }) => ({
  ...navItemStyles.title(theme),
  ...theme.typography.body2,
  fontWeight: theme.typography.fontWeightMedium,
  variants: [
    { props: { variant: 'subItem' }, style: { fontSize: theme.typography.pxToRem(13) } },
    { props: { active: true }, style: { fontWeight: theme.typography.fontWeightSemiBold } },
  ],
}));

/**
 * @slot content
 */
const ItemContent = styled('span', { shouldForwardProp })(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: theme.spacing(0.5),
  variants: [
    {
      props: { variant: 'subItem' },
      style: { maxWidth: 260 },
    },
    {
      props: { variant: 'rootItem' },
      style: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.75) },
    },
  ],
}));

/**
 * @slot description
 */
const ItemDescription = styled('span', { shouldForwardProp })(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.vars.palette.text.secondary,
  fontSize: theme.typography.pxToRem(12),
  lineHeight: 1.5,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  variants: [
    {
      props: { variant: 'rootItem' },
      style: { display: 'none' },
    },
  ],
}));

/**
 * @slot icon
 */
const ItemIcon = styled('span', { shouldForwardProp })(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  color: theme.vars.palette.primary.main,
  borderRadius: '50%',
  variants: [
    {
      props: { variant: 'subItem' },
      style: {
        marginTop: 0,
      },
    },
  ],
}));

/**
 * @slot arrow
 */
const ItemArrow = styled(Iconify, { shouldForwardProp })(({ open, theme }) => ({
  ...navItemStyles.arrow(theme),
  marginLeft: theme.spacing(0.25),
  transform: 'rotate(0deg)',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shorter,
  }),
  variants: [{ props: { open: true }, style: { transform: 'rotate(180deg)' } }],
}));
