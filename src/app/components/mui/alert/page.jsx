import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const AlertView = createLazyView(() => import('src/sections/_examples/mui/alert-view'), 'AlertView');

// ----------------------------------------------------------------------

export const metadata = { title: `Alert | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <AlertView />;
}
