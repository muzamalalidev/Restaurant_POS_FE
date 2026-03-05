import { paths } from 'src/routes/paths';

import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

import { PermissionPageGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const StockDocumentsListView = createLazyView(
  () => import('src/sections/tenant/stock-documents/list/stock-documents-list-view'),
  'StockDocumentsListView'
);

export const metadata = { title: `Stock Documents - ${CONFIG.appName}` };

export default function Page() {
  return (
    <PermissionPageGuard path={paths.tenant.stockDocuments.root}>
      <StockDocumentsListView />
    </PermissionPageGuard>
  );
}

