import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ScrollbarView = createLazyView(() => import('src/sections/_examples/extra/scrollbar-view'), 'ScrollbarView');

// ----------------------------------------------------------------------

export const metadata = { title: `Scrollbar | Components - ${CONFIG.appName}` };

export default function Page() {
  return <ScrollbarView />;
}
