import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const IconifyView = createLazyView(() => import('src/sections/_examples/foundation/icons-view'), 'IconifyView');

// ----------------------------------------------------------------------

export const metadata = { title: `Icon Iconify | Foundations - ${CONFIG.appName}` };

export default function Page() {
  return <IconifyView />;
}
