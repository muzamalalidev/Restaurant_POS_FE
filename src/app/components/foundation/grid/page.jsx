import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const GridView = createLazyView(() => import('src/sections/_examples/foundation/grid-view'), 'GridView');

// ----------------------------------------------------------------------

export const metadata = { title: `Grid | Foundations - ${CONFIG.appName}` };

export default function Page() {
  return <GridView />;
}
