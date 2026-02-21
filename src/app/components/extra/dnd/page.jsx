import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const DndView = createLazyView(() => import('src/sections/_examples/extra/dnd-view'), 'DndView', {
  ssr: false,
});

export const metadata = { title: `Dnd | Components - ${CONFIG.appName}` };

export default function Page() {
  return <DndView />;
}
