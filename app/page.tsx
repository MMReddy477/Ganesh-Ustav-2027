import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Heart,
  Music2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Countdown } from "@/components/countdown";
import { AudioToggle } from "@/components/audio-toggle";
import { CinematicHero } from "@/components/cinematic-hero";
import { Header } from "@/components/header";
import { ScrollEffects } from "@/components/scroll-effects";
import { DonationHistory } from "@/components/donation-history";
import { ExpenseLedger } from "@/components/expense-ledger";
import { HomepagePulse } from "@/components/homepage-pulse";
import { PublicActions } from "@/components/public-actions";
import { Gallery } from "@/components/gallery";
import { introSequenceFrames } from "@/lib/intro-sequence.generated";
import { referenceDonors, referenceEvents, referenceExpenseCategories, referenceExpenseLedger, referencePastAuctions, referenceSponsors, referenceSummary } from "@/lib/reference-data";

type Sponsor = { id: string; name: string; tier: string; logo_url: string | null; website_url: string | null; plot_flat?: string | null; contribution_amount?: number | null };
type FestivalEvent = { id: string; title: string; description: string | null; starts_at: string; location: string | null; status?: string };
type FestivalSummary = { donations: number; sponsorships: number; auction: number; expenses: number; donor_count: number; volunteer_count: number; event_count: number };
type WallDonor = { plot_flat: string | null; donor_name: string; amount: number; received_at: string; notes: string | null };
type ExpenseCategory = { category: string; amount: number };
type ExpenseRecord = { id: string; category: string; description: string; paid_to: string | null; spent_at: string; spent_at_time?: string | null; amount: number };
type PublishedImage = { id: string; title: string; description: string | null; image_url: string; category: string; alt_text: string };
type PublishedVideo = { id: string; title: string; description: string | null; video_url: string; poster_url: string | null; category: string };
type PublishedAudio = { id: string; title: string; description: string | null; audio_url: string; category: string };
type PublicAuction = { id: string; title: string; auction_type: string; festival_year: number; plot_flat: string | null; winning_amount: number | null; winner_name: string | null; winner_image_url: string | null };
const auctionCategoryLabels: Record<string, string> = {
  laddu_first: "1st Laddu Winner",
  laddu_second: "2nd Laddu Winner",
  laddu_third: "3rd Laddu Winner",
  kalasam_winner: "Kalasam Winner",
  laddu: "Laddu Winner",
  kalasam: "Kalasam Winner",
  coconut: "Coconut",
  other: "Other Auction",
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "Suryodaya Colony Ganesh Utsav 2027",
  description: "A community celebration of Ganesh Chaturthi in Suryodaya Colony, Bandlaguda Jagir, Hyderabad.",
  startDate: "2027-09-14T07:00:00+05:30",
  endDate: "2027-09-23T20:00:00+05:30",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: {
    "@type": "Place",
    name: "Suryodaya Colony Ganesh Utsav Mandapam",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bandlaguda Jagir, Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
  },
  image: [`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/images/Ganesha%20beneath%20golden%20temple%20bells.png`],
  organizer: { "@type": "Organization", name: "Suryodaya Colony Ganesh Utsav Committee" },
};

export default async function Home() {
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const upiId = process.env.NEXT_PUBLIC_UPI_ID;
  const committeePhone = process.env.NEXT_PUBLIC_COMMITTEE_PHONE;
  let sponsors: Sponsor[] = hasSupabase ? [] : referenceSponsors;
  let events: FestivalEvent[] = hasSupabase ? [] : referenceEvents;
  let summary: FestivalSummary | null = hasSupabase ? null : referenceSummary;
  let donorWall: WallDonor[] = hasSupabase ? [] : referenceDonors;
  let expenseCategories: ExpenseCategory[] = hasSupabase ? [] : referenceExpenseCategories;
  let expenseLedger: ExpenseRecord[] = hasSupabase ? [] : referenceExpenseLedger;
  let publicAuctions: PublicAuction[] = [];
  let publishedImages: PublishedImage[] = [];
  let publishedVideos: PublishedVideo[] = [];
  let publishedAudios: PublishedAudio[] = [];
  if (hasSupabase) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const [sponsorResult, summaryResult, wallResult, expensesResult, expenseLedgerResult, eventResult, auctionResult, imageResult, videoResult, audioResult] = await Promise.all([
      supabase.from("sponsors").select("id,name,tier,plot_flat,contribution_amount,logo_url,website_url").eq("is_published", true).order("sort_order"),
      supabase.rpc("public_festival_summary"),
      supabase.rpc("public_donation_wall"),
      supabase.rpc("public_expense_summary"),
      supabase.rpc("public_expense_ledger"),
      supabase.from("events").select("id,title,description,starts_at,location").eq("is_published", true).order("starts_at"),
      supabase.rpc("public_auction_items"),
      supabase.from("gallery_images").select("id,title,description,image_url,category,alt_text").eq("is_published", true).order("sort_order").order("created_at", { ascending: false }),
      supabase.from("gallery_videos").select("id,title,description,video_url,poster_url,category").eq("is_published", true).order("created_at", { ascending: false }),
      supabase.from("gallery_audios").select("id,title,description,audio_url,category").eq("is_published", true).order("created_at", { ascending: false }),
    ]);
    if (sponsorResult.error) console.error("Could not load public sponsors:", sponsorResult.error.message);
    if (summaryResult.error) console.error("Could not load public festival summary:", summaryResult.error.message);
    if (wallResult.error) console.error("Could not load the public donor wall:", wallResult.error.message);
    if (expensesResult.error) console.error("Could not load public expense totals:", expensesResult.error.message);
    if (expenseLedgerResult.error) console.error("Could not load the public expense ledger:", expenseLedgerResult.error.message);
    if (eventResult.error) console.error("Could not load public festival events:", eventResult.error.message);
    if (auctionResult.error) console.error("Could not load public auction archive:", auctionResult.error.message);
    if (imageResult.error) console.error("Could not load public gallery images:", imageResult.error.message);
    if (videoResult.error) console.error("Could not load public gallery videos:", videoResult.error.message);
    if (audioResult.error && audioResult.error.code !== "PGRST205") {
      console.error("Could not load public gallery audios:", audioResult.error.message);
    }
    sponsors = sponsorResult.data ?? [];
    summary = summaryResult.data;
    donorWall = wallResult.data ?? [];
    expenseCategories = expensesResult.data ?? [];
    expenseLedger = expenseLedgerResult.data ?? [];
    events = eventResult.data ?? [];
    publicAuctions = (auctionResult.data ?? []) as PublicAuction[];
    publishedImages = (imageResult.data ?? []) as PublishedImage[];
    publishedVideos = (videoResult.data ?? []) as PublishedVideo[];
    publishedAudios = (audioResult.data ?? []) as PublishedAudio[];
  }
  const archivedAuctionRecords = publicAuctions.filter((auction) => auction.festival_year === 2026);
  const pastAuctions = (archivedAuctionRecords.length
    ? archivedAuctionRecords.map((auction) => ({
        item: auction.title,
        category: auctionCategoryLabels[auction.auction_type] ?? "Auction Winner",
        plot_flat: auction.plot_flat ?? "—",
        winner: auction.winner_name ?? "Winner to be announced",
        amount: Number(auction.winning_amount ?? 0),
        image_url: auction.winner_image_url,
      }))
    : referencePastAuctions.map((auction) => ({ ...auction, category: `${auction.item} Winner`, image_url: null }))
  );
  const donationTotal = Number(summary?.donations ?? 0);
  const expenseTotal = Number(summary?.expenses ?? 0);
  const archivedAuctionTotal = pastAuctions.reduce((sum, auction) => sum + auction.amount, 0);
  const netBalance = donationTotal + archivedAuctionTotal - expenseTotal;
  const homepageMetrics = [
    {
      label: "Total donations", value: summary ? donationTotal : null, note: "Community contributions", icon: "donations" as const, format: "currency" as const,
      detailsNote: "Only publicly acknowledged gifts appear by name; the total includes all received donations.",
      details: donorWall.map((donation) => ({
        title: donation.donor_name || donation.plot_flat || "Community donation",
        description: donation.plot_flat ? `Plot / flat ${donation.plot_flat}` : undefined,
        amount: Number(donation.amount),
        dateTime: donation.received_at,
      })),
    },
    {
      label: "Last year's auction 2026", value: archivedAuctionTotal, note: "Archived community auction", icon: "auction" as const, format: "currency" as const,
      detailsNote: "Published winning bids from the 2026 archive.",
      details: pastAuctions.map((auction) => ({
        title: auction.category,
        description: `${auction.winner} · Plot / flat ${auction.plot_flat}`,
        amount: auction.amount,
      })),
    },
    {
      label: "Total expenses", value: summary ? expenseTotal : null, note: "Published festival spending", icon: "expenses" as const, format: "currency" as const,
      detailsNote: "Expense entries show the recorded date and time. Older entries may not have a recorded time.",
      details: expenseLedger.map((expense) => ({
        title: expense.description,
        description: `${expense.category}${expense.paid_to ? ` · Paid to ${expense.paid_to}` : ""}`,
        amount: Number(expense.amount),
        date: expense.spent_at,
        time: expense.spent_at_time,
      })),
    },
    {
      label: "Available balance", value: summary ? netBalance : null, note: "Donations + 2026 auction − expenses", icon: "balance" as const, format: "currency" as const,
      detailsNote: "Received donations + 2026 auction income − recorded expenses.",
      details: [
        { title: "Received donations", amount: donationTotal },
        { title: "2026 auction income", amount: archivedAuctionTotal },
        { title: "Total expenses", description: "Deducted from available balance", amount: expenseTotal },
      ],
    },
  ];
  const publicSchedule = events.length ? events.map((event, index) => {
    const date = new Date(event.starts_at);
    return {
      id: event.id,
      day: date.toLocaleDateString("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" }),
      month: date.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" }).toUpperCase(),
      title: event.title,
      detail: event.description || event.location || "Join us at the mandapam",
      time: date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }),
      status: event.status || (date.getTime() < Date.now() ? "DONE" : "UPCOMING"),
      icon: [Sparkles, Music2, UsersRound, Heart][index % 4],
    };
  }) : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Header />
      <main className="public-homepage">
        <CinematicHero introFrames={introSequenceFrames} />

        <HomepagePulse
          donations={[...donorWall].sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())}
          metrics={homepageMetrics}
        />

        <section className="hero-followup" aria-label="Join the celebration">
          <div className="hero-actions">
            <a className="button button-light" href="#schedule">View Programme <ArrowRight size={17} /></a>
            <AudioToggle />
          </div>
          <div className="hero-countdown"><div className="countdown-caption"><span className="live-dot" /> COUNTDOWN TO GANESH CHATURTHI</div><Countdown /></div>
        </section>

        <section className="schedule section-pad" id="schedule">
          <div className="section-heading schedule-heading">
            <div><p className="eyebrow"><span className="eyebrow-line" /> UTSAV SCHEDULE</p><h2>Live events <em>& aarti.</em></h2></div>
            <div className="schedule-meta"><CalendarDays size={17} /><span>14 — 23 September 2027<br /><small>Suryodaya Colony, Hyderabad</small></span></div>
          </div>
          <div className="event-timeline">
            {publicSchedule.map(({ id, day, month, title, detail, time, status, icon: Icon }) => (
              <article className={`event-row event-${status.toLowerCase().replaceAll(" ", "-")}`} key={id}>
                <span className="event-line-dot" aria-hidden="true" />
                <div className="event-card">
                  <div className="event-meta"><span className="event-status">{status}</span><span>{day} {month} 2027 · {time}</span></div>
                  <h3><Icon size={15} />{title}</h3>
                  <p>{detail}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="schedule-note">Aarti timings and programme updates are maintained by the committee.</p>
        </section>

        <section className="gallery-section section-pad" id="gallery">
          <div className="section-heading">
            <div><p className="eyebrow"><span className="eyebrow-line" /> FESTIVAL MEMORIES</p><h2>Photos, videos <em>& aarti audio.</em></h2></div>
            <p className="section-intro">Explore and download moments shared by the committee.</p>
          </div>
          <Gallery publishedImages={publishedImages} publishedVideos={publishedVideos} publishedAudios={publishedAudios} />
        </section>

        <section className="sponsors-section section-pad" id="sponsors">
          <div className="section-heading">
            <div><p className="eyebrow"><span className="eyebrow-line" /> WITH GRATITUDE</p><h2>Ganesh idol <em>sponsors.</em></h2></div>
            <p className="section-intro">Our celebration is made possible by neighbours and local partners who believe in bringing a community together.</p>
          </div>
          <div className="sponsor-row sponsor-row-featured">
            {sponsors.length ? sponsors.map((sponsor, index) => (
              <a className={`sponsor-card${index === 0 ? " sponsor-card-featured" : ""}`} key={sponsor.id} href={sponsor.website_url || "#sponsors"} target={sponsor.website_url ? "_blank" : undefined} rel={sponsor.website_url ? "noreferrer" : undefined}>
                {sponsor.logo_url ? <span className="sponsor-image-frame"><Image src={sponsor.logo_url} alt={`${sponsor.name} logo`} width={360} height={240} unoptimized /></span> : <span className="sponsor-initial">{sponsor.name.slice(0, 1)}</span>}
                <small>{sponsor.tier}</small><strong>{sponsor.name}</strong><span className="sponsor-location">{sponsor.plot_flat || "Community partner"}</span><b>{sponsor.contribution_amount ? `₹${Number(sponsor.contribution_amount).toLocaleString("en-IN")}` : "With gratitude"}</b>
              </a>
            )) : <p className="finance-empty">Sponsors will be listed here as the committee publishes confirmed partners.</p>}
          </div>
        </section>

        <section className="past-auction-section section-pad" id="auction-last">
          <div className="section-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> ANNUAL ARCHIVE · 2026</p><h2>Last year’s <em>community auction.</em></h2></div><p className="section-intro">Honouring the neighbours who carried forward this beloved tradition.</p></div>
          <div className="past-auction-layout">
            <div className="past-winners-grid">
              {pastAuctions.map((auction) => (
                <article className="past-winner-card" key={`${auction.category}-${auction.item}-${auction.plot_flat}`}>
                  {auction.image_url && <Image className="past-winner-image" src={auction.image_url} alt={`${auction.category}: ${auction.winner}`} width={640} height={360} unoptimized />}
                  <span>2026 · {auction.category.toUpperCase()}</span>
                  <h3>{auction.winner}</h3>
                  <p>Plot/Flat {auction.plot_flat}</p>
                  <strong>₹{auction.amount.toLocaleString("en-IN")}</strong>
                </article>
              ))}
            </div>
            <div className="past-auction-table"><table><thead><tr><th>Item</th><th>Plot/Flat No</th><th>Name</th><th>Amount</th></tr></thead><tbody>{pastAuctions.map((auction) => <tr key={`${auction.item}-${auction.plot_flat}`}><td>{auction.item}</td><td>{auction.plot_flat}</td><td>{auction.winner}</td><td>₹{auction.amount.toLocaleString("en-IN")}</td></tr>)}</tbody></table></div>
          </div>
        </section>

        <DonationHistory donations={donorWall} total={donationTotal} />

        <ExpenseLedger categories={expenseCategories} expenses={expenseLedger} total={expenseTotal} />

      </main>
      <footer className="footer" id="contact">
        <div className="footer-main"><div className="footer-brand"><Image src="/images/ganesh-logo.png" alt="Suryodaya Colony Ganesh Utsav Committee" width={56} height={56} /><span><strong>SURYODAYA COLONY</strong><small>GANESH UTSAV · 2027</small></span></div><p>Built with faith.<br /><em>Held together with love.</em></p><div className="footer-contact"><span>BE PART OF THE CELEBRATION</span><a href="#schedule">Festival programme</a><a href="#sponsors">Our sponsors</a><a href="https://wa.me/?text=Ganesh%20Utsav%202027%20%E2%80%94%20Suryodaya%20Colony%2C%20Hyderabad" target="_blank" rel="noreferrer">Share with a neighbour</a></div><div className="footer-nav"><a href="#schedule">Programme</a><a href="#auction-last">2026 Auction Archive</a><a href="#donations">Donations</a><Link href="/admin/login">Committee login</Link></div></div>
        <div className="footer-bottom"><span>© 2027 Suryodaya Colony Ganesh Utsav Committee</span><span>May Bappa’s blessings be with you. <span className="footer-om">ॐ</span></span></div>
      </footer>
      <PublicActions upiId={upiId} phone={committeePhone} />
      <ScrollEffects />
    </>
  );
}
