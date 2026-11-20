import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModuleManager, type AdminModuleName } from "@/components/module-manager";

export const metadata: Metadata = { title: "Manage festival data", robots: { index: false, follow: false } };

const modules: AdminModuleName[] = ["donations", "expenses", "events", "volunteers", "images", "videos", "audios", "announcements", "sponsors", "auctions"];

export default async function ManageModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const [{ module }, query] = await Promise.all([params, searchParams]);
  if (!modules.includes(module as AdminModuleName)) notFound();
  if (module === "auctions" && query.year === "2026") {
    return <ModuleManager moduleName="auctions" festivalYear={2026} />;
  }
  if (module === "auctions") {
    return <ModuleManager moduleName="auctions" festivalYear={2027} />;
  }
  return <ModuleManager moduleName={module as AdminModuleName} />;
}
