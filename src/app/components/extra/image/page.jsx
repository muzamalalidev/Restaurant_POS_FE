import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ImageView = createLazyView(() => import('src/sections/_examples/extra/image-view'), 'ImageView');

// ----------------------------------------------------------------------

export const metadata = { title: `Image | Components - ${CONFIG.appName}` };

export default function Page() {
  return <ImageView />;
}
