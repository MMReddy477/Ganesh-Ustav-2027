import type { Metadata } from "next";
import { ArrowUpRight, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HomepagePulse, type HomepageDonation, type Metric } from "@/components/homepage-pulse";
import { AdminSectionTabs } from "@/components/admin-section-tabs";
import { ModuleManager } from "@/components/module-manager";

export const metadata: Metadata = { title: "Committee dashboard", robots: { index: false, follow: false } };

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [summaryResult, donationResult, auctionResult, expenseResult] = await Promise.all([
    supabase.rpc("public_festival_summary"),
    supabase
      .from("donations")
      .select("plot_flat,donor_name,amount,received_at")
      .eq("payment_status", "received")
      .order("received_at", { ascending: false })
      .limit(100),
    supabase.from("auction_items")
      .select("id,title,festival_year,plot_flat,winning_amount,winner_name")
      .eq("festival_year", 2026)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("expenses")
      .select("id,category,description,paid_to,spent_at,spent_at_time,amount")
      .order("spent_at", { ascending: false })
      .order("spent_at_time", { ascending: false, nullsFirst: false })
      .limit(100),
  ]);
  const setupNeeded = Boolean(summaryResult.error || donationResult.error || auctionResult.error || expenseResult.error);
  if (summaryResult.error) console.error("Could not load the admin festival summary:", summaryResult.error);
  if (donationResult.error) console.error("Could not load recent admin donations:", donationResult.error);
  if (auctionResult.error) console.error("Could not load admin auction details:", auctionResult.error);
  if (expenseResult.error) console.error("Could not load admin expense details:", expenseResult.error);
  const summary = summaryResult.data;
  const donationTotal = Number(summary?.donations ?? 0);
  const expenseTotal = Number(summary?.expenses ?? 0);
  const archivedAuctions = (auctionResult.data ?? []) as Array<{ id: string; title: string; festival_year: number; plot_flat: string | null; winning_amount: number | null; winner_name: string | null }>;
  const expenses = (expenseResult.data ?? []) as Array<{ id: string; category: string; description: string; paid_to: string | null; spent_at: string; spent_at_time: string | null; amount: number }>;
  const archivedAuctionTotal = archivedAuctions.reduce((sum, auction) => sum + Number(auction.winning_amount ?? 0), 0);
  const metrics: Metric[] = [
    {
      label: "Total donations", value: donationTotal, note: "Community contributions", icon: "donations", format: "currency",
      details: (donationResult.data ?? []).map((donation) => ({
        title: donation.donor_name || donation.plot_flat || "Community donation",
        description: donation.plot_flat ? `Plot / flat ${donation.plot_flat}` : undefined,
        amount: Number(donation.amount),
        dateTime: donation.received_at,
      })),
    },
    {
      label: "Last year's auction 2026", value: archivedAuctionTotal, note: "Archived community auction", icon: "auction", format: "currency",
      details: archivedAuctions.map((auction) => ({
        title: auction.title,
        description: `${auction.winner_name || "Winner not disclosed"} · Plot / flat ${auction.plot_flat || "—"}`,
        amount: Number(auction.winning_amount ?? 0),
      })),
    },
    {
      label: "Total expenses", value: expenseTotal, note: "Festival spending", icon: "expenses", format: "currency",
      details: expenses.map((expense) => ({
        title: expense.description,
        description: `${expense.category}${expense.paid_to ? ` · Paid to ${expense.paid_to}` : ""}`,
        amount: Number(expense.amount),
        date: expense.spent_at,
        time: expense.spent_at_time,
      })),
    },
    {
      label: "Available balance", value: donationTotal + archivedAuctionTotal - expenseTotal, note: "Donations + 2026 auction − expenses", icon: "balance", format: "currency",
      details: [
        { title: "Received donations", amount: donationTotal },
        { title: "2026 auction income", amount: archivedAuctionTotal },
        { title: "Total expenses", description: "Deducted from available balance", amount: expenseTotal },
      ],
    },
  ];
  const recentDonations = (donationResult.data ?? []) as HomepageDonation[];

  return (
    <main className="admin-dashboard admin-dashboard-home">
      {setupNeeded && <p className="admin-setup-note">Some dashboard data could not be loaded. Check Supabase configuration and table permissions, then refresh.</p>}
      <HomepagePulse
        donations={recentDonations}
        metrics={metrics}
        viewAllHref="#donations"
        emptyMessage="No donations have been recorded yet."
        variant="admin"
      />
      <AdminSectionTabs active="donations" />
      <ModuleManager moduleName="donations" compact />
      <Link className="admin-volunteer-shortcut" href="/admin/manage/volunteers"><HeartHandshake size={15} /> Review volunteer applications <ArrowUpRight size={14} /></Link>
    </main>
  );
}
