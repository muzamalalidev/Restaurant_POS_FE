'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';

import { MenuNavItem } from './menu-nav-item';

// ----------------------------------------------------------------------

/**
 * MenuNavList - Navigation list with single-open accordion behavior
 *
 * Features:
 * - Renders nav items from navData
 * - Single-open accordion (closing others when one opens)
 * - Staggered animation via CSS nth-child
 *
 * @param {array} data - Navigation data from nav-config-main
 * @param {function} onNavigate - Navigate with animation callback (plays close animation, then navigates)
 */
export function MenuNavList({ data, onNavigate }) {
  // Single-open accordion state (stores the title of open item)
  const [openAccordion, setOpenAccordion] = useState(null);

  const handleToggleAccordion = (title) => {
    setOpenAccordion((prev) => (prev === title ? null : title));
  };

  return (
    <Box component="nav" aria-label="Main navigation">
      <Box component="ul" className="mm-nav">
        {data.map((item) => (
          <MenuNavItem
            key={item.title}
            item={item}
            isOpen={openAccordion === item.title}
            onToggle={() => handleToggleAccordion(item.title)}
            onNavigate={onNavigate}
          />
        ))}
      </Box>
    </Box>
  );
}
