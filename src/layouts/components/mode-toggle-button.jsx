'use client';

import { m } from 'framer-motion';

import Tooltip from '@mui/material/Tooltip';
import SvgIcon from '@mui/material/SvgIcon';
import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';

import { settingIcons } from 'src/components/settings/drawer/icons';
import { varTap, varHover, transitionTap } from 'src/components/animate';

// ----------------------------------------------------------------------

export function ModeToggleButton({ sx, ...other }) {
  const { colorScheme, setMode } = useColorScheme();

  const isLight = colorScheme === 'light';

  const handleToggle = () => {
    setMode(isLight ? 'dark' : 'light');
  };

  return (
    <Tooltip title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}>
      <IconButton
        component={m.button}
        whileTap={varTap(0.96)}
        whileHover={varHover(1.04)}
        transition={transitionTap()}
        aria-label="Toggle color mode"
        onClick={handleToggle}
        sx={[{ p: 0, width: 40, height: 40 }, ...(Array.isArray(sx) ? sx : [sx])]}
        {...other}
      >
        <SvgIcon sx={{ fontSize: 22 }}>
          {settingIcons.moon}
        </SvgIcon>
      </IconButton>
    </Tooltip>
  );
}
