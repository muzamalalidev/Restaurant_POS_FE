import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const SignUpView = createLazyView(() => import('src/auth/view/sign-up-view'), 'SignUpView');

export const metadata = { title: `Sign up | Layout centered - ${CONFIG.appName}` };

export default function Page() {
  return <SignUpView />;
}
