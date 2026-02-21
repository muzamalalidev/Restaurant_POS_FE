import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const BranchesView = createLazyView(() => import('src/sections/tenant/branches/list/branch-list-view'), 'BranchesView');

export const metadata = { title: `Branches - ${CONFIG.appName}` };

export default function Page() {
  return <BranchesView />;
}

