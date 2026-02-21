import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ShadowsView = createLazyView(() => import('src/sections/_examples/foundation/shadows-view'), 'ShadowsView');

// ----------------------------------------------------------------------

export const metadata = { title: `Shadows | Foundations - ${CONFIG.appName}` };

export default function Page() {
  return <ShadowsView />;
}
