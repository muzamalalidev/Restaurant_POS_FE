import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function TenantPage() {
  redirect(paths.tenant.branches.root);
}
