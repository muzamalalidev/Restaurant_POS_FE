import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TimelineView = createLazyView(() => import('src/sections/_examples/mui/timeline-view'), 'TimelineView');

// ----------------------------------------------------------------------

export const metadata = { title: `Timeline | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <TimelineView />;
}
