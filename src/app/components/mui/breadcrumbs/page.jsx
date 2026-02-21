import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const BreadcrumbsView = createLazyView(() => import('src/sections/_examples/mui/breadcrumbs-view'), 'BreadcrumbsView');

// ----------------------------------------------------------------------

export const metadata = { title: `Breadcrumbs | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <BreadcrumbsView />;
}
