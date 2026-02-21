import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const RecipeListView = createLazyView(
  () => import('src/sections/tenant/recipes/list/recipe-list-view'),
  'RecipeListView'
);

export const metadata = { title: `Recipes - ${CONFIG.appName}` };

export default function Page() {
  return <RecipeListView />;
}

