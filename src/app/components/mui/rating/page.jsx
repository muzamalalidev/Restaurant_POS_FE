import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const RatingView = createLazyView(() => import('src/sections/_examples/mui/rating-view'), 'RatingView');

// ----------------------------------------------------------------------

export const metadata = { title: `Rating | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <RatingView />;
}
