import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const PopoverView = createLazyView(() => import('src/sections/_examples/mui/popover-view'), 'PopoverView');

// ----------------------------------------------------------------------

export const metadata = { title: `Popover | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <PopoverView />;
}
