import Link from "next/link";

const tabs = [
  { href: "/admin/manage/donations", label: "Donations", active: "donations" },
  { href: "/admin/manage/sponsors", label: "Sponsors", active: "sponsors" },
  { href: "/admin/manage/auctions", label: "Auction (2027)", active: "auctions-current" },
  { href: "/admin/manage/auctions?year=2026", label: "Auction (2026 Archive)", active: "auctions-2026" },
  { href: "/admin/manage/expenses", label: "Expenses", active: "expenses" },
  { href: "/admin/manage/events", label: "Live Events", active: "events" },
  { href: "/admin/manage/images", label: "Gallery", active: "images" },
  { href: "/admin/manage/audios", label: "Audio", active: "audios" },
  { href: "/admin/manage/volunteers", label: "Volunteers", active: "volunteers" },
  { href: "/admin/manage/announcements", label: "Notices", active: "announcements" },
];

export function AdminSectionTabs({ active }: { active: string }) {
  return (
    <nav className="admin-tabs" aria-label="Admin modules">
      {tabs.map((tab) => (
        <Link className={tab.active === active ? "active" : ""} aria-current={tab.active === active ? "page" : undefined} href={tab.href} key={tab.active}>{tab.label}</Link>
      ))}
    </nav>
  );
}
