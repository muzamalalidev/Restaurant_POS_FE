import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const StaffListView = createLazyView(() => import('src/sections/tenant/staff/list/staff-list-view'), 'StaffListView');

export const metadata = { title: `Staff - ${CONFIG.appName}` };

export default function Page() {
  return <StaffListView />;
}

