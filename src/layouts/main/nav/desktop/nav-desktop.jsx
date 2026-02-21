import { Nav, NavUl } from '../components';
import { NavList } from './nav-desktop-list';

// ----------------------------------------------------------------------

export function NavDesktop({ data, sx, ...other }) {
  return (
    <Nav
      sx={[
        (theme) => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: theme.spacing(2.5),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <NavUl
        sx={{
          gap: 5,
          height: 1,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        {data.map((list) => (
          <NavList key={list.title} data={list} />
        ))}
      </NavUl>
    </Nav>
  );
}
