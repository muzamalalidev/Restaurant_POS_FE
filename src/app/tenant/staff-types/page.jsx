import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const StaffTypeListView = createLazyView(() => import('src/sections/tenant/staff-types/list/staff-type-list-view'), 'StaffTypeListView');

export const metadata = { title: `Staff Types - ${CONFIG.appName}` };

export default function Page() {
  return <StaffTypeListView />;
}

