import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ColorsView = createLazyView(() => import('src/sections/_examples/foundation/colors-view'), 'ColorsView');

export const metadata = { title: `Colors | Foundations - ${CONFIG.appName}` };

export default function Page() {
  return <ColorsView />;
}
