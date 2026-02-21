'use client';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

const LINKS = [
  {
    headline: 'Legal',
    children: [
      { name: 'Terms of Service', href: paths.termsOfService },
      { name: 'Privacy Policy', href: paths.privacyPolicy },
    ],
  },
];

// ----------------------------------------------------------------------

export function Footer({ sx, layoutQuery = 'md' }) {
  return (
    <Box
      component="footer"
      sx={[
        (theme) => ({
          py: { xs: 6, [layoutQuery]: 8 },
          px: 3,
          backgroundColor: theme.vars.palette.background.default,
          fontFamily: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', sans-serif",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Container maxWidth="lg">
        {/* Main Grid */}
        <Box
          sx={(theme) => ({
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 4,
            mb: 6,
            [theme.breakpoints.up(layoutQuery)]: {
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 6,
            },
          })}
        >
          {/* Brand Column */}
          <Box
            sx={(theme) => ({
              gridColumn: 'span 1',
              [theme.breakpoints.up(layoutQuery)]: { gridColumn: 'span 4' },
            })}
          >
            <Link
              component={RouterLink}
              href="/"
              sx={{
                display: 'inline-flex',
                mb: 2,
                textDecoration: 'none',
              }}
            >
              <Box
                component="span"
                sx={(theme) => ({
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  fontSize: '1.75rem',
                  color: theme.vars.palette.text.primary,
                })}
              >
                Minimal
                <Box component="span" sx={{ color: 'primary.main' }}>
                  Dashboard
                </Box>
              </Box>
            </Link>

            <Box
              component="p"
              sx={(theme) => ({
                color: theme.vars.palette.text.secondary,
                fontSize: '0.875rem',
                maxWidth: 320,
                lineHeight: 1.7,
                m: 0,
              })}
            >
              Modernizing the selling process with AI-driven tools and absolute transparency.
            </Box>
          </Box>

          {/* Link Columns */}
          {LINKS.map((section) => (
            <Box
              key={section.headline}
              sx={(theme) => ({
                gridColumn: 'span 1',
                [theme.breakpoints.up(layoutQuery)]: { gridColumn: 'span 2' },
              })}
            >
              <Box
                component="h5"
                sx={(theme) => ({
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: theme.vars.palette.text.disabled,
                  mb: 2,
                  mt: 0,
                })}
              >
                {section.headline}
              </Box>

              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {section.children.map((link) => (
                  <Box component="li" key={link.name} sx={{ mb: 1.5 }}>
                    <Link
                      component={RouterLink}
                      href={link.href}
                      sx={(theme) => ({
                        color: theme.vars.palette.text.secondary,
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        transition: 'color 0.2s ease',
                        '&:hover': {
                          color: theme.vars.palette.primary.main,
                        },
                      })}
                    >
                      {link.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}

          {/* Contact Column */}
          <Box
            sx={(theme) => ({
              gridColumn: 'span 1',
              [theme.breakpoints.up(layoutQuery)]: { gridColumn: 'span 4' },
            })}
          >
            <Box
              component="h5"
              sx={(theme) => ({
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: theme.vars.palette.text.disabled,
                mb: 2,
                mt: 0,
              })}
            >
              Contact
            </Box>

            <Link
              href="mailto:info@minimals.cc"
              sx={(theme) => ({
                color: theme.vars.palette.text.primary,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: theme.vars.palette.primary.main,
                },
              })}
            >
              info@minimals.cc
            </Link>
          </Box>
        </Box>

        {/* Bottom Copyright */}
        <Box
          sx={(theme) => ({
            pt: 4,
            position: 'relative',
            textAlign: 'center',
            color: theme.vars.palette.text.disabled,
            fontSize: '0.875rem',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.15)} 15%, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.25)} 50%, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.15)} 85%, transparent 100%)`,
            },
          })}
        >
          © {new Date().getFullYear()} Minimal Dashboard. All rights reserved.
        </Box>
      </Container>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function HomeFooter({ sx }) {
  return <Footer sx={sx} />;
}
