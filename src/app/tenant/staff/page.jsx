import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const StaffListView = createLazyView(() => import('src/sections/tenant/staff/list/staff-list-view'), 'StaffListView');

export const metadata = { title: `Staff - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.staff.root}>
      <StaffListView />
    </PermissionPageGuard>
  );
}

