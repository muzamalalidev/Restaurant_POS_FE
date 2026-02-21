import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const BlankView = createLazyView(() => import('src/sections/blank/view'), 'BlankView');

export const metadata = {
  title: `Item match params | Dashboard - ${CONFIG.appName}`,
};

export default function Page() {
  return (
    <BlankView
      title="Match params"
      description="Active on matching path with dynamic parameters."
    />
  );
}
