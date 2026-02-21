import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const PermissionDeniedView = createLazyView(() => import('src/sections/permission/view'), 'PermissionDeniedView');

export const metadata = { title: `Permission | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <PermissionDeniedView />;
}
