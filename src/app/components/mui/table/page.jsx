import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TableView = createLazyView(() => import('src/sections/_examples/mui/table-view'), 'TableView');

// ----------------------------------------------------------------------

export const metadata = { title: `Table | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <TableView />;
}
