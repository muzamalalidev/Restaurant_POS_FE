import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const DatePickersView = createLazyView(() => import('src/sections/_examples/mui/date-pickers-view'), 'DatePickersView');

// ----------------------------------------------------------------------

export const metadata = { title: `Date pickers | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <DatePickersView />;
}
