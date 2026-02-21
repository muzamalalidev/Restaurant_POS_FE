import { createLazyView } from 'src/utils/dynamic-imports';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const MarkdownView = createLazyView(() => import('src/sections/_examples/extra/markdown-view'), 'MarkdownView', {
  ssr: false,
});

export const metadata = { title: `Markdown | Components - ${CONFIG.appName}` };

export default function Page() {
  return <MarkdownView />;
}
