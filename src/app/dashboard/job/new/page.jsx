import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const JobCreateView = createLazyView(() => import('src/sections/job/view'), 'JobCreateView');

export const metadata = { title: `Create a new job | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <JobCreateView />;
}
