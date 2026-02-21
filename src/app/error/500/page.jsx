import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const View500 = createLazyView(() => import('src/sections/error'), 'View500');

export const metadata = {
  title: `500 Internal server error! | Error - ${CONFIG.appName}`,
};

export default function Page() {
  return <View500 />;
}
