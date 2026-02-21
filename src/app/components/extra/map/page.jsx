import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const MapView = createLazyView(() => import('src/sections/_examples/extra/map-view'), 'MapView', {
  ssr: false,
});

export const metadata = { title: `Map | Components - ${CONFIG.appName}` };

export default function Page() {
  return <MapView />;
}
