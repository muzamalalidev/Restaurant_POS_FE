import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ComponentsView = createLazyView(() => import('src/sections/_examples/view'), 'ComponentsView');

export const metadata = { title: `All components | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <ComponentsView />;
}
