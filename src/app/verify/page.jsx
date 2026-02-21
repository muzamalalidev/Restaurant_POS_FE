import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const VerifyView = createLazyView(() => import('src/auth/view/verify-view'), 'VerifyView');

export const metadata = { title: `Verify | Layout centered - ${CONFIG.appName}` };

export default function Page() {
  return <VerifyView />;
}
