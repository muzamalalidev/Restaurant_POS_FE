import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const SignInView = createLazyView(() => import('src/auth/view/sign-in-view'), 'SignInView');

export const metadata = { title: `Sign in | Layout centered - ${CONFIG.appName}` };

export default function Page() {
  return <SignInView />;
}
