import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

/**
 * Root "/" redirects to default website navigation target (paths.home = sign-in).
 * Keeps single source of truth in paths.js for where users land when opening the app.
 */
export default function HomePage() {
  redirect(paths.home);
}
