import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const UploadView = createLazyView(() => import('src/sections/_examples/extra/upload-view'), 'UploadView');

// ----------------------------------------------------------------------

export const metadata = { title: `Upload | Components - ${CONFIG.appName}` };

export default function Page() {
  return <UploadView />;
}
