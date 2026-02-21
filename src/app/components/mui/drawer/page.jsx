import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const DrawerView = createLazyView(() => import('src/sections/_examples/mui/drawer-view'), 'DrawerView');

// ----------------------------------------------------------------------

export const metadata = { title: `Drawer | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <DrawerView />;
}
