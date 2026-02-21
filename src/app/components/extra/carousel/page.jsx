import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const CarouselView = createLazyView(() => import('src/sections/_examples/extra/carousel-view'), 'CarouselView', {
  ssr: false,
});

export const metadata = { title: `Carousel | Components - ${CONFIG.appName}` };

export default function Page() {
  return <CarouselView />;
}
