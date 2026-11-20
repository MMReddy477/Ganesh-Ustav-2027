"use client";

import { ArrowUpDown, Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";

export type DonationHistoryEntry = {
  plot_flat: string | null;
  donor_name: string;
  amount: number;
  received_at: string;
  notes: string | null;
};

const currency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export function DonationHistory({ donations, total }: { donations: DonationHistoryEntry[]; total: number }) {
  const [query, setQuery] = useState("");
  const [amountFilter, setAmountFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return donations
      .filter((donation) => {
        const matchesSearch = `${donation.plot_flat ?? ""} ${donation.donor_name}`.toLowerCase().includes(search);
        const amount = Number(donation.amount);
        const matchesAmount = amountFilter === "all" || (amountFilter === "under-10000" ? amount < 10000 : amount >= 10000);
        return matchesSearch && matchesAmount;
      })
      .sort((a, b) => {
        const amountDifference = Number(a.amount) - Number(b.amount);
        const dateDifference = (Date.parse(a.received_at) || 0) - (Date.parse(b.received_at) || 0);
        if (sortOrder === "amount-low") return amountDifference;
        if (sortOrder === "amount-high") return -amountDifference;
        return sortOrder === "oldest" ? dateDifference : -dateDifference;
      });
  }, [donations, query, amountFilter, sortOrder]);
  const filteredTotal = filtered.reduce((sum, donation) => sum + Number(donation.amount), 0);

  return (
    <section className="donation-history section-pad" id="donations">
      <div className="section-heading">
        <div><p className="eyebrow"><span className="eyebrow-line" /> OUR CONTRIBUTORS</p><h2>Donations <em>received.</em></h2></div>
        <p className="section-intro">Every contribution, big or small, recorded transparently. Names are shown only with the donor’s permission.</p>
      </div>
      <div className="history-card">
        <div className="history-card-heading">
          <div><strong>Community contributions</strong><span>{donations.length} entries · {currency(total)}</span></div>
          <div className="history-controls">
            <label className="history-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or plot/flat" aria-label="Search donations by name or plot or flat" /></label>
            <label className="history-select"><Filter size={15} /><select value={amountFilter} onChange={(event) => setAmountFilter(event.target.value)} aria-label="Filter donations by amount"><option value="all">All amounts</option><option value="under-10000">Under ₹10,000</option><option value="10000-plus">₹10,000 and above</option></select></label>
            <label className="history-select"><ArrowUpDown size={15} /><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort donations"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount-high">Highest amount</option><option value="amount-low">Lowest amount</option></select></label>
          </div>
        </div>
        <div className="history-table-scroll">
          <table className="history-table">
            <thead><tr><th>#</th><th>Plot / Flat</th><th>Name</th><th>Date</th><th>Amount</th><th>Notes</th></tr></thead>
            <tbody>
              {filtered.map((donation, index) => (
                <tr key={`${donation.plot_flat}-${donation.received_at}-${index}`}>
                  <td>{index + 1}</td><td>{donation.plot_flat || "—"}</td><td>{donation.donor_name}</td>
                  <td>{new Date(donation.received_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</td>
                  <td>{currency(Number(donation.amount))}</td><td>{donation.notes || "—"}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td className="history-empty" colSpan={6}>{query || amountFilter !== "all" ? "No contributions match these filters." : "Donations will be listed here as they are recorded."}</td></tr>}
            </tbody>
            <tfoot><tr><td colSpan={4}>{filtered.length} {filtered.length === 1 ? "donation" : "donations"} shown</td><td>{currency(filteredTotal)}</td><td /></tr></tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
