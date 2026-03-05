import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const CategoryListView = createLazyView(() => import('src/sections/tenant/categories/list/category-list-view'), 'CategoryListView');

export const metadata = { title: `Categories - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.categories.root}>
      <CategoryListView />
    </PermissionPageGuard>
  );
}

