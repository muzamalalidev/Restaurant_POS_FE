import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ListView = createLazyView(() => import('src/sections/_examples/mui/list-view'), 'ListView');

// ----------------------------------------------------------------------

export const metadata = { title: `List | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <ListView />;
}
