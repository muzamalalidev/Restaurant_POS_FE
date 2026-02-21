import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const BadgeView = createLazyView(() => import('src/sections/_examples/mui/badge-view'), 'BadgeView');

// ----------------------------------------------------------------------

export const metadata = { title: `Badge | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <BadgeView />;
}
