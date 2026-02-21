import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TabsView = createLazyView(() => import('src/sections/_examples/mui/tabs-view'), 'TabsView');

// ----------------------------------------------------------------------

export const metadata = { title: `Tabs | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <TabsView />;
}
