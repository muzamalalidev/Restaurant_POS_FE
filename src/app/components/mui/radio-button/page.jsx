import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const RadioButtonView = createLazyView(() => import('src/sections/_examples/mui/radio-button-view'), 'RadioButtonView');

// ----------------------------------------------------------------------

export const metadata = { title: `Radio button | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <RadioButtonView />;
}
