'use client';

import Box from '@mui/material/Box';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Arrow icon for simple link items (appears on hover)
 */
function ArrowIcon() {
  return (
    <svg
      className="mm-nav-link__icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="2.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

/**
 * Chevron icon for accordion items (rotates on open)
 */
function ChevronIcon() {
  return (
    <svg
      className="mm-nav-link__chevron"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ----------------------------------------------------------------------

/**
 * MenuNavItem - Individual navigation item (link or accordion)
 *
 * Features:
 * - Simple link with arrow icon on hover
 * - Accordion with chevron rotation
 * - Sub-items with icon + description
 * - Disabled state with badge
 *
 * @param {object} item - Nav item data { title, path, children? }
 * @param {boolean} isOpen - Accordion open state
 * @param {function} onToggle - Toggle accordion
 * @param {function} onNavigate - Navigate with animation (plays close animation, then navigates)
 */
export function MenuNavItem({ item, isOpen, onToggle, onNavigate }) {
  const { title, path, children } = item;
  const hasChildren = children && children.length > 0;

  // Simple link (no children)
  if (!hasChildren) {
    return (
      <Box component="li" className="mm-nav-item">
        <Box
          component="a"
          href={path}
          onClick={(e) => {
            e.preventDefault();
            onNavigate(path);
          }}
          className="mm-nav-link"
        >
          {title}
          <ArrowIcon />
        </Box>
      </Box>
    );
  }

  // Accordion item (has children)
  return (
    <Box component="li" className={`mm-nav-item ${isOpen ? 'mm-nav-item--open' : ''}`}>
      {/* Accordion trigger */}
      <Box
        component="button"
        type="button"
        onClick={onToggle}
        className="mm-nav-link"
        aria-expanded={isOpen}
      >
        {title}
        <ChevronIcon />
      </Box>

      {/* Accordion content */}
      <Box className="mm-accordion">
        <Box className="mm-accordion__inner">
          <Box component="ul" className="mm-accordion__list">
            {children.map((group) =>
              group.items.map((subItem) => (
                <SubItem key={subItem.title} item={subItem} onNavigate={onNavigate} />
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ----------------------------------------------------------------------

/**
 * SubItem - Submenu item with icon and description
 */
function SubItem({ item, onNavigate }) {
  const { title, path, icon, description, disabled } = item;

  const handleClick = (e) => {
    if (disabled) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <Box component="li">
      <Box
        component={disabled ? 'span' : 'a'}
        href={disabled ? undefined : path}
        onClick={handleClick}
        className={`mm-sub-link ${disabled ? 'mm-sub-link--disabled' : ''}`}
      >
        <span className="mm-sub-link__title">
          {icon && <Iconify icon={icon} className="mm-sub-link__icon" width={20} />}
          {title}
          {disabled && <span className="mm-sub-link__badge">Coming Soon</span>}
        </span>
        {description && !disabled && <span className="mm-sub-link__desc">{description}</span>}
      </Box>
    </Box>
  );
}
