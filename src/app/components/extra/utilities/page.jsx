import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const UtilitiesView = createLazyView(() => import('src/sections/_examples/extra/utilities-view'), 'UtilitiesView');

// ----------------------------------------------------------------------

export const metadata = { title: `Utilities | Components - ${CONFIG.appName}` };

export default function Page() {
  return <UtilitiesView />;
}
