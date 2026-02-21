import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const PaginationView = createLazyView(() => import('src/sections/_examples/mui/pagination-view'), 'PaginationView');

// ----------------------------------------------------------------------

export const metadata = { title: `Pagination | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <PaginationView />;
}
