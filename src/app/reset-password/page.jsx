import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ResetPasswordView = createLazyView(() => import('src/auth/view/reset-password-view'), 'ResetPasswordView');

export const metadata = { title: `Reset password | Layout centered - ${CONFIG.appName}` };

export default function Page() {
  return <ResetPasswordView />;
}
