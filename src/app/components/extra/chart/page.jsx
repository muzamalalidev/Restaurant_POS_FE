import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const ChartView = createLazyView(() => import('src/sections/_examples/extra/chart-view'), 'ChartView', {
  ssr: false,
});

export const metadata = { title: `Chart | Components - ${CONFIG.appName}` };

export default function Page() {
  return <ChartView />;
}
