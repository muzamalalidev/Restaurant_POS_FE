import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TypographyView = createLazyView(() => import('src/sections/_examples/foundation/typography-view'), 'TypographyView');

// ----------------------------------------------------------------------

export const metadata = { title: `Typography | Foundations - ${CONFIG.appName}` };

export default function Page() {
  return <TypographyView />;
}
