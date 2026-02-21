import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const AccordionView = createLazyView(() => import('src/sections/_examples/mui/accordion-view'), 'AccordionView');

// ----------------------------------------------------------------------

export const metadata = { title: `Accordion | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <AccordionView />;
}
