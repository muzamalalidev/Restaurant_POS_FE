import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const LayoutView = createLazyView(() => import('src/sections/_examples/extra/layout-view'), 'LayoutView');

// ----------------------------------------------------------------------

export const metadata = { title: `Layout | Components - ${CONFIG.appName}` };

export default function Page() {
  return <LayoutView />;
}
