import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const EditorView = createLazyView(() => import('src/sections/_examples/extra/editor-view'), 'EditorView', {
  ssr: false,
});

export const metadata = { title: `Editor | Components - ${CONFIG.appName}` };

export default function Page() {
  return <EditorView />;
}
