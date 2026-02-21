import { createLazyView } from 'src/utils/dynamic-imports';

// ----------------------------------------------------------------------

const HomeView = createLazyView(() => import('src/sections/home/view'), 'HomeView');

export const metadata = {
  title: 'Minimal UI - Modern Dashboard Theme',
  description: 'A modern, clean dashboard theme built with Next.js and Material-UI',
};

export default function Page() {
  return <HomeView />;
}
