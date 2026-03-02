'use client';

import Link from 'next/link';
import Image from 'next/image';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

// BrandGradientDef is no longer needed (logo is a PNG now), but kept as
// a no-op export so existing imports don't break.
export function BrandGradientDef() {
  return null;
}

// ----------------------------------------------------------------------

export function SidebarBrand() {
  return (
    <Link href={paths.platform.tenantMasters.root} className="brand-capsule">
      <div className="logo-icon">
        <Image
          src={`${CONFIG.assetsDir}logo/house-logo.png`}
          alt="Cloud Mate Restaurant POS logo"
          width={42}
          height={42}
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
      <div className="brand-text">
        <span className="brand-name">Cloud Mate</span>
        <span className="brand-tagline">Restaurant POS</span>
      </div>
    </Link>
  );
}
