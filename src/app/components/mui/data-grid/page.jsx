import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const DataGridView = createLazyView(() => import('src/sections/_examples/mui/data-grid-view'), 'DataGridView');

// ----------------------------------------------------------------------

export const metadata = { title: `DataGrid | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <DataGridView />;
}
