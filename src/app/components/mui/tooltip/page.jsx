import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TooltipView = createLazyView(() => import('src/sections/_examples/mui/tooltip-view'), 'TooltipView');

// ----------------------------------------------------------------------

export const metadata = { title: `Tooltip | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <TooltipView />;
}
