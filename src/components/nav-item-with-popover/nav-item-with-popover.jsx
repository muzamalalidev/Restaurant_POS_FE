'use client';

import { useState } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function NavItemWithPopover({ 
  item, 
  reports = [], 
  isLoading = false,
  sx,
  ...other 
}) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReportClick = (reportPath) => {
    router.push(reportPath);
    handleClose();
  };

  const handleViewAll = () => {
    router.push(item.path);
    handleClose();
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{
          minHeight: 44,
          borderRadius: 0.75,
          typography: 'body2',
          color: 'text.secondary',
          textTransform: 'capitalize',
          fontWeight: 'fontWeightMedium',
          ...sx,
        }}
        {...other}
      >
        <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
          {item.icon}
        </Box>

        <Box component="span" sx={{ flexGrow: 1 }}>
          {item.title}
        </Box>

        <Iconify
          icon="eva:chevron-right-fill"
          sx={{
            width: 16,
            height: 16,
            ml: 1,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </ListItemButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              maxHeight: 320,
              ml: 0.5,
            },
          },
        }}
      >
        <Paper sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
            Recent Reports
          </Typography>

          <List dense>
            {isLoading ? (
              <ListItem>
                <Typography variant="body2" color="text.secondary">
                  Loading recent reports...
                </Typography>
              </ListItem>
            ) : reports.length === 0 ? (
              <ListItem>
                <Typography variant="body2" color="text.secondary">
                  No recent reports yet.
                </Typography>
              </ListItem>
            ) : (
              <>
                {reports.map((report) => (
                  <ListItem key={report.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleReportClick(paths.dashboard.sellerReport.details(report.id))}
                      sx={{ borderRadius: 0.75 }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {report.shortAddress}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ${(report.estimatedValue / 1000).toFixed(0)}k
                        </Typography>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </>
            )}

            <ListItem disablePadding sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <ListItemButton
                onClick={handleViewAll}
                sx={{ borderRadius: 0.75, justifyContent: 'center' }}
              >
                <Typography variant="body2" color="primary">
                  View All Reports
                </Typography>
              </ListItemButton>
            </ListItem>
          </List>
        </Paper>
      </Popover>
    </>
  );
}