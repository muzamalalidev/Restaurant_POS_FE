import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const StaffTypeListView = createLazyView(() => import('src/sections/tenant/staff-types/list/staff-type-list-view'), 'StaffTypeListView');

export const metadata = { title: `Staff Types - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.staffTypes.root}>
      <StaffTypeListView />
    </PermissionPageGuard>
  );
}

