import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const UsersView = createLazyView(() => import('src/sections/platform/users/list/user-list-view'), 'UsersView');

export const metadata = { title: `Users - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.platform.users.root}>
      <UsersView />
    </PermissionPageGuard>
  );
}

