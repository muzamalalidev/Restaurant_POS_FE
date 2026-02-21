import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const LabelView = createLazyView(() => import('src/sections/_examples/extra/label-view'), 'LabelView');

// ----------------------------------------------------------------------

export const metadata = { title: `Label | Components - ${CONFIG.appName}` };

export default function Page() {
  return <LabelView />;
}
