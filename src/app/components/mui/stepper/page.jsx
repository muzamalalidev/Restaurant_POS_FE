import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const StepperView = createLazyView(() => import('src/sections/_examples/mui/stepper-view'), 'StepperView');

// ----------------------------------------------------------------------

export const metadata = { title: `Stepper | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <StepperView />;
}
