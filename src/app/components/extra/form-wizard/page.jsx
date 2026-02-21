import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const FormWizardView = createLazyView(() => import('src/sections/_examples/extra/form-wizard-view'), 'FormWizardView');

// ----------------------------------------------------------------------

export const metadata = { title: `Form wizard | Components - ${CONFIG.appName}` };

export default function Page() {
  return <FormWizardView />;
}
