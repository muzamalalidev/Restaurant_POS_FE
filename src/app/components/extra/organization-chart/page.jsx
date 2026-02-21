import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const OrganizationalChartView = createLazyView(
  () => import('src/sections/_examples/extra/organizational-chart-view'),
  'OrganizationalChartView',
  {
    ssr: false,
  }
);

export const metadata = {
  title: `Organizational chart | Components - ${CONFIG.appName}`,
};

export default function Page() {
  return <OrganizationalChartView />;
}
