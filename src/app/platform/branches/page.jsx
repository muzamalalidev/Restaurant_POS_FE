import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const BranchesView = createLazyView(
  () => import('src/sections/platform/branches/list/branch-list-view'),
  'BranchesView'
);

export const metadata = { title: `Branches - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.platform.branches.root}>
      <BranchesView />
    </PermissionPageGuard>
  );
}
