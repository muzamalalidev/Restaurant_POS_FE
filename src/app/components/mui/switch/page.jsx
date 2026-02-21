import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const SwitchView = createLazyView(() => import('src/sections/_examples/mui/switch-view'), 'SwitchView');

// ----------------------------------------------------------------------

export const metadata = { title: `Switch | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <SwitchView />;
}
