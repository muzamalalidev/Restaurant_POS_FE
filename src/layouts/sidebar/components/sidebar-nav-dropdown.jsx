'use client';

import Link from 'next/link';
import { useState } from 'react';
import { isActiveLink } from 'minimal-shared/utils';

import { usePathname } from 'src/routes/hooks';

import { useSidebar } from '../sidebar-context';
import { getNavIcon } from './sidebar-nav-item';

// ----------------------------------------------------------------------

export function SidebarNavDropdown({ item }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [expanded, setExpanded] = useState(false);

  const isActive = isActiveLink(pathname, item.path, true);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isCollapsed) setExpanded((prev) => !prev);
  };

  // Separate children: real nav items vs dividers
  const reportItems = item.children?.filter((c) => !c.disabled && c.title !== 'View All Reports') || [];
  const viewAllItem = item.children?.find((c) => c.title === 'View All Reports');

  return (
    <div className={`nav-dropdown${expanded ? ' expanded' : ''}`}>
      <button
        type="button"
        className={`nav-item nav-item-expandable${isActive ? ' active' : ''}`}
        onClick={handleToggle}
        data-tooltip={item.title}
      >
        <span className="nav-icon">{item.icon ?? getNavIcon(item.title)}</span>
        <span>{item.title}</span>
        <svg
          className="nav-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className="nav-dropdown-content">
        <div className="dropdown-reports-list">
          {reportItems.map((child) => {
            const isCurrent = pathname === child.path;
            return (
              <Link
                key={child.path || child.title}
                href={child.path}
                className={`dropdown-report-item${isCurrent ? ' current' : ''}`}
              >
                <span className="report-address">{child.title}</span>
                {child.caption && <span className="report-price">{child.caption}</span>}
              </Link>
            );
          })}
        </div>

        {viewAllItem && (
          <Link href={viewAllItem.path} className="dropdown-view-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>View All Reports</span>
          </Link>
        )}
      </div>
    </div>
  );
}
