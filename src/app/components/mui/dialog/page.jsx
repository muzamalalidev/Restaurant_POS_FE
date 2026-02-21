import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const DialogView = createLazyView(() => import('src/sections/_examples/mui/dialog-view'), 'DialogView');

// ----------------------------------------------------------------------

export const metadata = { title: `Dialog | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <DialogView />;
}
