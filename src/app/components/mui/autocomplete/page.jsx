import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const AutocompleteView = createLazyView(() => import('src/sections/_examples/mui/autocomplete-view'), 'AutocompleteView');

// ----------------------------------------------------------------------

export const metadata = { title: `Autocomplete | MUI - ${CONFIG.appName}` };

export default function Page() {
  return <AutocompleteView />;
}
