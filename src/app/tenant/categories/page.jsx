import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const CategoryListView = createLazyView(() => import('src/sections/tenant/categories/list/category-list-view'), 'CategoryListView');

export const metadata = { title: `Categories - ${CONFIG.appName}` };

export default function Page() {
  return <CategoryListView />;
}

