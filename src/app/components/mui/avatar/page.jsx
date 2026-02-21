import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const AvatarView = createLazyView(() => import('src/sections/_examples/mui/avatar-view'), 'AvatarView');

// ----------------------------------------------------------------------

export const metadata = { title: `Avatar | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <AvatarView />;
}
