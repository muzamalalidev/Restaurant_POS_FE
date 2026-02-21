import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const SnackbarView = createLazyView(() => import('src/sections/_examples/extra/snackbar-view'), 'SnackbarView');

// ----------------------------------------------------------------------

export const metadata = { title: `Snackbar | Components - ${CONFIG.appName}` };

export default function Page() {
  return <SnackbarView />;
}
