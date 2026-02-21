import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const CheckboxView = createLazyView(() => import('src/sections/_examples/mui/checkbox-view'), 'CheckboxView');

// ----------------------------------------------------------------------

export const metadata = { title: `Checkbox | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <CheckboxView />;
}
