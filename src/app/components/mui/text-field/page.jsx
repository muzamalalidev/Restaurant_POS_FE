import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const TextFieldView = createLazyView(() => import('src/sections/_examples/mui/text-field-view'), 'TextFieldView');

// ----------------------------------------------------------------------

export const metadata = { title: `Text field | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <TextFieldView />;
}
