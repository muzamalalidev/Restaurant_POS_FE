import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ButtonsView = createLazyView(() => import('src/sections/_examples/mui/button-view'), 'ButtonsView');

export const metadata = { title: `Buttons | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <ButtonsView />;
}
