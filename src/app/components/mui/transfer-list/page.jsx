import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TransferListView = createLazyView(() => import('src/sections/_examples/mui/transfer-list-view'), 'TransferListView');

// ----------------------------------------------------------------------

export const metadata = { title: `Transfer list | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <TransferListView />;
}
