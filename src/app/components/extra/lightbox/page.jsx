import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const LightboxView = createLazyView(() => import('src/sections/_examples/extra/lightbox-view'), 'LightboxView', {
  ssr: false,
});

export const metadata = { title: `Lightbox | Components - ${CONFIG.appName}` };

export default function Page() {
  return <LightboxView />;
}
