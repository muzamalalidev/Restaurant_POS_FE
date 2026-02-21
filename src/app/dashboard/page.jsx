import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function DashboardPage() {
  redirect(paths.platform.tenantMasters.root);
}
