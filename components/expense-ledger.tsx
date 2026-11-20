import { Check } from "lucide-react";
import { formatFestivalDate, formatFestivalTime } from "@/lib/festival-date-time";

export type ExpenseCategoryEntry = { category: string; amount: number };
export type ExpenseLedgerEntry = { id: string; category: string; description: string; paid_to: string | null; spent_at: string; spent_at_time?: string | null; amount: number };

const currency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const chartColors = ["#e6b956", "#a9672f", "#7d3e2e", "#c98f50", "#6f7a4b", "#87664f"];

export function ExpenseLedger({ categories, expenses, total }: { categories: ExpenseCategoryEntry[]; expenses: ExpenseLedgerEntry[]; total: number }) {
  const maxAmount = Math.max(1, ...categories.map((item) => Number(item.amount)));
  const categoryTotal = categories.reduce((sum, item) => sum + Math.max(0, Number(item.amount)), 0);
  let chartOffset = 0;
  const chartStops = categories.filter((item) => Number(item.amount) > 0).map((item, index) => {
    const start = chartOffset;
    chartOffset += Number(item.amount) / Math.max(1, categoryTotal) * 100;
    return `${chartColors[index % chartColors.length]} ${start}% ${chartOffset}%`;
  });
  const chartBackground = chartStops.length
    ? `conic-gradient(${chartStops.join(", ")})`
    : "conic-gradient(#49382d 0 100%)";

  return (
    <section className="expense-ledger section-pad" id="expenses">
      <div className="section-heading">
        <div><p className="eyebrow"><span className="eyebrow-line" /> FULL TRANSPARENCY</p><h2>Where the money <em>goes.</em></h2></div>
        <p className="section-intro">Every expense of the Utsav, open for all residents. Totals reflect the accounts recorded by the committee.</p>
      </div>
      <div className="expense-layout">
        <div className="expense-category-card"><div className="transparency-card-head"><span>BY CATEGORY</span><strong>{currency(total)}</strong><small>Recorded expenses</small></div>
          {categories.map((item) => <div className="expense-bar-row" key={item.category}><span>{item.category}</span><b>{currency(Number(item.amount))}</b><div><i style={{ width: `${Math.min(100, Number(item.amount) / maxAmount * 100)}%` }} /></div></div>)}
          {!categories.length && <p className="finance-empty">Expense categories will appear when the committee publishes its accounts.</p>}
        </div>
        <div className="expense-ledger-card">
          <div className="expense-ledger-table-scroll"><table className="expense-table">
            <thead><tr><th>Category</th><th>Description</th><th>Paid to</th><th>Date &amp; time (IST)</th><th>Amount</th></tr></thead>
            <tbody>{expenses.map((item) => <tr key={item.id}><td><span className="expense-tag">{item.category}</span></td><td>{item.description}</td><td>{item.paid_to || "—"}</td><td>{formatFestivalDate(item.spent_at)} {formatFestivalTime(item.spent_at_time)}</td><td>{currency(Number(item.amount))}</td></tr>)}
              {!expenses.length && <tr><td className="history-empty" colSpan={5}>Expense records will appear here when the committee publishes its accounts.</td></tr>}</tbody>
          </table></div>
        </div>
      </div>
      <div className="rupee-trust">
        <div className="rupee-trust-heading">
          <div><p className="eyebrow"><span className="eyebrow-line" /> OPEN ACCOUNTS, SHARED PURPOSE</p><h3>How every rupee <em>is used.</em></h3></div>
          <p>Allocation is based on the expenses recorded in the committee ledger.</p>
        </div>
        <div className="rupee-trust-content">
          <div className="rupee-pie" role="img" aria-label="Pie chart showing published expenses by category" style={{ background: chartBackground }}>
            <span>{currency(categoryTotal || total)}<small>recorded</small></span>
          </div>
          <div className="rupee-legend">
            {categories.length ? categories.map((item, index) => (
              <div className="rupee-legend-item" key={item.category}>
                <span className="rupee-legend-label"><i style={{ background: chartColors[index % chartColors.length] }} /><Check size={14} />{item.category}</span>
                <strong>{currency(Number(item.amount))}</strong>
              </div>
            )) : <p className="finance-empty">Published expense categories will appear here as accounts are recorded.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
