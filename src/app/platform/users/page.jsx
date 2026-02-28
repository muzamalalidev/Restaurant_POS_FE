import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const UsersView = createLazyView(() => import('src/sections/platform/users/list/user-list-view'), 'UsersView');

export const metadata = { title: `Users - ${CONFIG.appName}` };

export default function Page() {
  return <UsersView />;
}

