import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ChipView = createLazyView(() => import('src/sections/_examples/mui/chip-view'), 'ChipView');

// ----------------------------------------------------------------------

export const metadata = { title: `Chip | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <ChipView />;
}
