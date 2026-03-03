import { CONFIG } from 'src/global-config';

import { RolesPageGuard } from './roles-page-guard';

// ----------------------------------------------------------------------

export const metadata = { title: `Roles - ${CONFIG.appName}` };

export default function Page() {
  return <RolesPageGuard />;
}
