import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const UpdatePasswordView = createLazyView(() => import('src/auth/view/update-password-view'), 'UpdatePasswordView');

export const metadata = {
  title: `Update password | Layout centered - ${CONFIG.appName}`,
};

export default function Page() {
  return <UpdatePasswordView />;
}
