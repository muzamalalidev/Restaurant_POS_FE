import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const SliderView = createLazyView(() => import('src/sections/_examples/mui/slider-view'), 'SliderView');

// ----------------------------------------------------------------------

export const metadata = { title: `Slider | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <SliderView />;
}
