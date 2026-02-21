import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const IconsView = createLazyView(() => import('src/sections/_examples/foundation/icons-view'), 'IconsView');

// ----------------------------------------------------------------------

export const metadata = { title: `Icons | Foundations - ${CONFIG.appName}` };

export default function Page() {
  return <IconsView />;
}
