import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const MenuView = createLazyView(() => import('src/sections/_examples/mui/menu-view'), 'MenuView');

// ----------------------------------------------------------------------

export const metadata = { title: `Menu | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <MenuView />;
}
