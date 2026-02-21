'use client';

import { createPortal } from 'react-dom';

import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import useMediaQuery from '@mui/material/useMediaQuery';

import { RouterLink } from 'src/routes/components';

import { BackLink } from './back-link';
import { MoreLinks } from './more-links';
import { BreadcrumbsLink } from './breadcrumb-link';
import { useBreadcrumbsPortal } from './breadcrumbs-context';
import {
  BreadcrumbsRoot,
  BreadcrumbsHeading,
  BreadcrumbsContent,
  BreadcrumbsContainer,
  BreadcrumbsSeparator,
  BreadcrumbsHeaderNav,
  BreadcrumbsHeaderRoot,
  BreadcrumbsHeaderSlash,
  BreadcrumbsHeaderActions,
  BreadcrumbsHeaderHeading,
} from './styles';

// ----------------------------------------------------------------------

export function CustomBreadcrumbs({
  sx,
  action,
  backHref,
  heading,
  slots = {},
  links = [],
  moreLinks = [],
  slotProps = {},
  activeLast = false,
  ...other
}) {
  const { portalTarget } = useBreadcrumbsPortal();

  // Check breakpoint for condensed mobile view
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const lastLink = links[links.length - 1]?.name;

  // Use portal when target exists (both mobile and desktop)
  const shouldUsePortal = !!portalTarget;

  const renderHeading = () => (
    <BreadcrumbsHeading {...slotProps?.heading}>
      {backHref ? <BackLink href={backHref} label={heading} /> : heading}
    </BreadcrumbsHeading>
  );

  const renderLinks = () =>
    slots?.breadcrumbs ?? (
      <Breadcrumbs separator={<BreadcrumbsSeparator />} {...slotProps?.breadcrumbs}>
        {links.map((link, index) => (
          <BreadcrumbsLink
            key={link.name ?? index}
            icon={link.icon}
            href={link.href}
            name={link.name}
            disabled={link.name === lastLink && !activeLast}
          />
        ))}
      </Breadcrumbs>
    );

  const renderMoreLinks = () => <MoreLinks links={moreLinks} {...slotProps?.moreLinks} />;

  // Header version (rendered in navbar via portal)
  // Desktop: Dashboard / Products / **Product Details**
  // Mobile: Products / **Details** (condensed - only last parent + current page)
  const renderHeaderContent = () => {
    const allItems = [];

    // On mobile, only show last parent link + current page
    // On desktop, show all links
    const displayLinks = mdUp ? links : links.slice(-2);

    displayLinks.forEach((link, index) => {
      const isLast = index === displayLinks.length - 1;

      if (isLast) {
        // Last item is the current page - show as heading
        // On mobile, truncate long headings
        const displayHeading = mdUp ? (heading || link.name) : (link.name || heading);

        allItems.push(
          <BreadcrumbsHeaderHeading key={`heading-${link.name}`} className={mdUp ? '' : 'mobile'}>
            {displayHeading}
          </BreadcrumbsHeaderHeading>
        );
      } else {
        // Parent links
        if (link.href) {
          allItems.push(
            <Link
              key={`link-${link.name}`}
              component={RouterLink}
              href={link.href}
              sx={{
                typography: 'body2',
                color: 'text.secondary',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                fontSize: { xs: '0.8125rem', md: '0.875rem' },
                transition: (theme) => theme.transitions.create(['color']),
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {link.name}
            </Link>
          );
        } else {
          // No href - render as plain text (non-clickable)
          allItems.push(
            <Typography
              key={`link-${link.name}`}
              variant="body2"
              sx={{
                color: 'text.secondary',
                whiteSpace: 'nowrap',
                fontSize: { xs: '0.8125rem', md: '0.875rem' },
              }}
            >
              {link.name}
            </Typography>
          );
        }

        // Add slash separator
        allItems.push(
          <BreadcrumbsHeaderSlash key={`slash-${index}`}>/</BreadcrumbsHeaderSlash>
        );
      }
    });

    // If no links but heading exists, just show heading
    if (!links.length && heading) {
      allItems.push(
        <BreadcrumbsHeaderHeading key="heading-only">{heading}</BreadcrumbsHeaderHeading>
      );
    }

    return (
      <BreadcrumbsHeaderRoot>
        <BreadcrumbsHeaderNav>{allItems}</BreadcrumbsHeaderNav>

        {action && <BreadcrumbsHeaderActions>{action}</BreadcrumbsHeaderActions>}
      </BreadcrumbsHeaderRoot>
    );
  };

  // Default version (rendered in page content) - fallback when no portal
  const renderDefaultContent = () => (
    <BreadcrumbsRoot sx={sx} {...other}>
      <BreadcrumbsContainer {...slotProps?.container}>
        <BreadcrumbsContent {...slotProps?.content}>
          {(heading || backHref) && renderHeading()}
          {(!!links.length || slots?.breadcrumbs) && renderLinks()}
        </BreadcrumbsContent>
        {action}
      </BreadcrumbsContainer>

      {!!moreLinks?.length && renderMoreLinks()}
    </BreadcrumbsRoot>
  );

  // Use portal when available (both mobile and desktop)
  if (shouldUsePortal) {
    return createPortal(renderHeaderContent(), portalTarget);
  }

  return renderDefaultContent();
}
