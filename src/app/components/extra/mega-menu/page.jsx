import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const MegaMenuView = createLazyView(() => import('src/sections/_examples/extra/mega-menu-view'), 'MegaMenuView');

// ----------------------------------------------------------------------

export const metadata = { title: `Mega menu | Components - ${CONFIG.appName}` };

export default function Page() {
  return <MegaMenuView />;
}
