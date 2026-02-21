import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const navData = [
  { title: 'Home', path: '/', icon: <Iconify width={22} icon="solar:home-angle-bold-duotone" /> },
  {
    title: 'Components',
    path: paths.components,
    icon: <Iconify width={22} icon="solar:atom-bold-duotone" />,
  },
  {
    title: 'Pages',
    path: paths.pages,
    icon: <Iconify width={22} icon="solar:file-bold-duotone" />,
    children: [
      {
        subheader: 'Other',
        items: [
          { title: 'Coming soon', path: paths.comingSoon },
        ],
      },
      {
        subheader: 'Auth',
        items: [
          { title: 'Sign in', path: paths.auth.signIn },
          { title: 'Sign up', path: paths.auth.signUp },
          { title: 'Reset password', path: paths.auth.resetPassword },
          { title: 'Update password', path: paths.auth.updatePassword },
          { title: 'Verify', path: paths.auth.verify },
        ],
      },
      {
        subheader: 'Error',
        items: [
          { title: 'Page 403', path: paths.page403 },
          { title: 'Page 404', path: paths.page404 },
          { title: 'Page 500', path: paths.page500 },
        ],
      },
    ],
  },
];
