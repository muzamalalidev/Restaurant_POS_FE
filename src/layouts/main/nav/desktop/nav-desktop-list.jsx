import { useBoolean } from 'minimal-shared/hooks';
import { useRef, useEffect, useCallback } from 'react';
import { isEqualPath, isActiveLink, isExternalLink } from 'minimal-shared/utils';

import ClickAwayListener from '@mui/material/ClickAwayListener';

import { usePathname } from 'src/routes/hooks';

import { NavItem } from './nav-desktop-item';
import { Nav, NavLi, NavUl, NavDropdown } from '../components';
import { NavItemDashboard } from './nav-desktop-item-dashboard';

// ----------------------------------------------------------------------

export function NavList({ data, sx, ...other }) {
  const pathname = usePathname();
  const navItemRef = useRef(null);

  const childItems = data.children
    ?.map((group) => group.items ?? [])
    .flat()
    .filter(Boolean);

  const hasActiveChild = childItems?.some((item) =>
    isEqualPath(item.path, pathname) || isActiveLink(pathname, item.path, item.deepMatch)
  );

  const isActive =
    isActiveLink(pathname, data.path, data.deepMatch ?? !!data.children) || hasActiveChild;

  const { value: open, onFalse: onClose, onToggle } = useBoolean();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleToggleMenu = useCallback(() => {
    if (data.children) {
      onToggle();
    }
  }, [data.children, onToggle]);

  const renderNavItem = () => (
    <NavItem
      ref={navItemRef}
      // slots
      path={data.path}
      title={data.title}
      // state
      open={open}
      active={isActive}
      // options
      hasChild={!!data.children}
      externalLink={isExternalLink(data.path)}
      // action
      onClick={handleToggleMenu}
    />
  );

  const renderDropdown = () =>
    !!data.children && (
      <NavDropdown open={open}>
        <Nav>
          <NavUl sx={{ gap: 3, flexDirection: 'row' }}>
            {data.children.map((list) => (
              <NavSubList
                key={list.subheader ?? list.items?.[0]?.title ?? list.items.length}
                subheader={list.subheader}
                data={list.items}
              />
            ))}
          </NavUl>
        </Nav>
      </NavDropdown>
    );

  return (
    <NavLi sx={sx} {...other}>
      <ClickAwayListener onClickAway={onClose}>
        <div>
          {renderNavItem()}
          {renderDropdown()}
        </div>
      </ClickAwayListener>
    </NavLi>
  );
}

// ----------------------------------------------------------------------

function NavSubList({ data, subheader, sx, ...other }) {
  const pathname = usePathname();

  const isDashboard = subheader === 'Dashboard';

  return (
    <NavLi
      sx={[
        () => ({
          flexGrow: isDashboard ? 1 : 0,
          flexBasis: 'auto',
          flexShrink: isDashboard ? 1 : 0,
          ...(isDashboard && { maxWidth: 560 }),
          ...(!isDashboard && { minWidth: 380, maxWidth: 520 }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <NavUl sx={{ gap: 1.5 }}>
        {subheader ? (
          <NavLi
            sx={(theme) => ({
              ml: 0.5,
              typography: 'overline',
              fontSize: theme.typography.pxToRem(11),
            })}
          >
            {subheader}
          </NavLi>
        ) : null}

        {data.map((item) =>
          isDashboard ? (
            <NavLi key={item.title} sx={{ mt: 0.75 }}>
              <NavItemDashboard path={item.path} />
            </NavLi>
          ) : (
            <NavLi key={item.title}>
              <NavItem
                subItem
                title={item.title}
                path={item.path}
                icon={item.icon}
                description={item.description}
                active={isEqualPath(item.path, pathname)}
              />
            </NavLi>
          )
        )}
      </NavUl>
    </NavLi>
  );
}
