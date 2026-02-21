import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TreeView = createLazyView(() => import('src/sections/_examples/mui/tree-view'), 'TreeView');

// ----------------------------------------------------------------------

export const metadata = { title: `Tree view | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <TreeView />;
}
