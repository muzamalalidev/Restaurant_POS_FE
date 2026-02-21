import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ProgressView = createLazyView(() => import('src/sections/_examples/mui/progress-view'), 'ProgressView');

// ----------------------------------------------------------------------

export const metadata = { title: `Progress | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <ProgressView />;
}
