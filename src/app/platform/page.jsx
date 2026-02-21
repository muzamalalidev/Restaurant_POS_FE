import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function PlatformPage() {
  redirect(paths.platform.tenantMasters.root);
}
