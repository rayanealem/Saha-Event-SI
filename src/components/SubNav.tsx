'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = { label: string; href: string };

export default function SubNav({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <div className="o-subnav">
      {tabs.map(t => (
        <Link
          key={t.href}
          href={t.href}
          className={`o-subnav-item ${pathname === t.href || (t.href !== '/halls' && pathname.startsWith(t.href)) ? 'active' : ''}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
