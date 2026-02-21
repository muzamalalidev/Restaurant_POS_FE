import { useState } from 'react';
import { m } from 'framer-motion';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Accordion, { accordionClasses } from '@mui/material/Accordion';

import { Iconify } from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

import { SectionTitle } from './components/section-title';
import { FloatLine, FloatPlusIcon, FloatTriangleDownIcon } from './components/svg-elements';

// ----------------------------------------------------------------------

const FAQs = [
  {
    question: 'What technologies does this theme use?',
    answer: (
      <Typography>
        This theme is built with Next.js 15, Material UI (MUI) v6, Emotion for styling, Framer
        Motion for animations, React Hook Form with Zod for form validation, and many more modern
        libraries to help you build production-ready web applications.
      </Typography>
    ),
  },
  {
    question: 'What is included in the theme?',
    answer: (
      <Box component="ul" sx={{ pl: 3, listStyleType: 'disc' }}>
        <li>Complete theme system with dark mode support</li>
        <li>Multiple layout options (Dashboard, Main, Auth)</li>
        <li>70+ example pages showcasing all components</li>
        <li>Reusable UI components and utilities</li>
        <li>Internationalization (i18n) support</li>
        <li>Authentication demo pages (JWT, Auth0, Firebase, Supabase, Amplify)</li>
      </Box>
    ),
  },
  {
    question: 'How do I customize the theme?',
    answer: (
      <Box component="ul" sx={{ pl: 3, listStyleType: 'disc' }}>
        <li>Modify the color palette in the theme configuration</li>
        <li>Customize typography settings for your brand</li>
        <li>Override component styles using MUI theme overrides</li>
        <li>Adjust shadows and border radius for your design language</li>
        <li>Toggle between light and dark modes via the settings drawer</li>
      </Box>
    ),
  },
  {
    question: 'Does this theme support dark mode?',
    answer: (
      <Typography>
        Yes. The theme includes a complete dark mode implementation with smooth transitions. You can
        toggle between light and dark modes using the settings drawer, and the preference is
        persisted across sessions using local storage.
      </Typography>
    ),
  },
  {
    question: 'Can I use this theme for commercial projects?',
    answer: (
      <Typography>
        Yes. The theme is licensed for commercial use. You can use it to build client projects, SaaS
        applications, admin dashboards, and any other web application. It is designed to serve as a
        solid foundation for production-ready applications.
      </Typography>
    ),
  },
  {
    question: 'How do I get started?',
    answer: (
      <Typography>
        Simply clone the repository, install dependencies with npm or yarn, and run the development
        server. The theme is ready to use out of the box with example pages, demo authentication
        flows, and a comprehensive component library. Check the README for detailed setup
        instructions.
      </Typography>
    ),
  },
];

// ----------------------------------------------------------------------

export function HomeFAQs({ sx, ...other }) {
  const [expanded, setExpanded] = useState(FAQs[0].question);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const renderDescription = () => (
    <SectionTitle
      caption="FAQs"
      title="We've got the"
      txtGradient="answers"
      sx={{ textAlign: 'center' }}
    />
  );

  const renderContent = () => (
    <Box
      sx={[
        {
          mt: 8,
          gap: 1,
          mx: 'auto',
          maxWidth: 720,
          display: 'flex',
          mb: { xs: 5, md: 8 },
          flexDirection: 'column',
        },
      ]}
    >
      {FAQs.map((item, index) => (
        <Accordion
          key={item.question}
          disableGutters
          component={m.div}
          variants={varFade('inUp', { distance: 24 })}
          expanded={expanded === item.question}
          onChange={handleChange(item.question)}
          sx={(theme) => ({
            transition: theme.transitions.create(['background-color'], {
              duration: theme.transitions.duration.shorter,
            }),
            py: 1,
            px: 2.5,
            border: 'none',
            borderRadius: 2,
            '&:hover': {
              bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            },
            [`&.${accordionClasses.expanded}`]: {
              bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            },
          })}
        >
          <AccordionSummary
            id={`home-faqs-panel${index}-header`}
            aria-controls={`home-faqs-panel${index}-content`}
          >
            <Typography component="span" variant="h6">
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>{item.answer}</AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  const renderContact = () => (
    <Box
      sx={[
        (theme) => ({
          px: 3,
          py: 8,
          textAlign: 'center',
          background: `linear-gradient(to left, ${varAlpha(
            theme.vars.palette.grey['500Channel'],
            0.08
          )}, transparent)`,
        }),
      ]}
    >
      <m.div variants={varFade('in')}>
        <Typography variant="h4">Still have questions?</Typography>
      </m.div>

      <m.div variants={varFade('in')}>
        <Typography sx={{ mt: 2, mb: 3, color: 'text.secondary' }}>
          Our team is here to help you get started
        </Typography>
      </m.div>

      <m.div variants={varFade('in')}>
        <Button
          color="inherit"
          variant="contained"
          href="mailto:support@minimals.cc?subject=[Feedback] from Customer"
          startIcon={<Iconify icon="solar:letter-bold" />}
        >
          Contact us
        </Button>
      </m.div>
    </Box>
  );

  return (
    <Box component="section" sx={sx} {...other}>
      <MotionViewport sx={{ py: 10, position: 'relative' }}>
        {topLines()}

        <Container>
          {renderDescription()}
          {renderContent()}
        </Container>

        <Stack sx={{ position: 'relative' }}>
          {bottomLines()}
          {renderContact()}
        </Stack>
      </MotionViewport>
    </Box>
  );
}

// ----------------------------------------------------------------------

const topLines = () => (
  <>
    <Stack
      spacing={8}
      alignItems="center"
      sx={{
        top: 64,
        left: 80,
        position: 'absolute',
        transform: 'translateX(-50%)',
      }}
    >
      <FloatTriangleDownIcon sx={{ position: 'static', opacity: 0.12 }} />
      <FloatTriangleDownIcon
        sx={{
          width: 30,
          height: 15,
          opacity: 0.24,
          position: 'static',
        }}
      />
    </Stack>

    <FloatLine vertical sx={{ top: 0, left: 80 }} />
  </>
);

const bottomLines = () => (
  <>
    <FloatLine sx={{ top: 0, left: 0 }} />
    <FloatLine sx={{ bottom: 0, left: 0 }} />
    <FloatPlusIcon sx={{ top: -8, left: 72 }} />
    <FloatPlusIcon sx={{ bottom: -8, left: 72 }} />
  </>
);
