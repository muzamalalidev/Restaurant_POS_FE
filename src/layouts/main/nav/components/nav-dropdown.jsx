import Fade from '@mui/material/Fade';
import { styled } from '@mui/material/styles';

// ----------------------------------------------------------------------

const NavDropdownPaper = styled('div')(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  boxShadow: theme.vars.customShadows.dropdown,
  padding: theme.spacing(3.5, 3.75, 3.5, 3),
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
}));

// ----------------------------------------------------------------------

export const NavDropdown = styled(({ open, children, ...other }) => (
  <Fade in={open}>
    <div {...other}>
      <NavDropdownPaper>{children}</NavDropdownPaper>
    </div>
  </Fade>
))(({ theme }) => ({
  left: theme.spacing(1.5),
  width: 'fit-content',
  position: 'absolute',
  padding: theme.spacing(1.5),
  zIndex: theme.zIndex.drawer * 2,
  maxWidth: 720,
  minWidth: 400,
  top: 'calc(100% + 8px)',
}));
