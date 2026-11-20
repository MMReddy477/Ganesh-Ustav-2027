export const referenceSummary = {
  donations: 144351,
  sponsorships: 145000,
  auction: 0,
  expenses: 130500,
  donor_count: 10,
  volunteer_count: 0,
  event_count: 5,
};

export const referenceSponsors = [
  { id: "sponsor-krishna", name: "Krishna Murthy & Family", tier: "Ganesh Idol Sponsor", plot_flat: "Villa 7", contribution_amount: 75000, logo_url: null, website_url: null },
  { id: "sponsor-rani", name: "Rani Teja Constructions", tier: "Mandap Decoration", plot_flat: "Plot/Flat 208", contribution_amount: 35000, logo_url: null, website_url: null },
  { id: "sponsor-sridevi", name: "Sridevi & Prakash", tier: "Annaprasadam", plot_flat: "Plot/Flat 301", contribution_amount: 20000, logo_url: null, website_url: null },
  { id: "sponsor-naveen", name: "Naveen Electricals", tier: "Sound & Lighting", plot_flat: "Plot/Flat 115", contribution_amount: 15000, logo_url: null, website_url: null },
];

export const referenceDonors = [
  { plot_flat: "102", donor_name: "Srinivas Rao", amount: 11116, received_at: "2027-09-10T09:00:00+05:30", notes: "—" },
  { plot_flat: "203", donor_name: "Lakshmi Narayana", amount: 5001, received_at: "2027-09-10T09:10:00+05:30", notes: "—" },
  { plot_flat: "204", donor_name: "Venkatesh Sharma", amount: 10001, received_at: "2027-09-10T09:20:00+05:30", notes: "In memory of parents" },
  { plot_flat: "305", donor_name: "Padma Priya", amount: 2116, received_at: "2027-09-10T09:30:00+05:30", notes: "—" },
  { plot_flat: "306", donor_name: "Suresh Babu", amount: 15000, received_at: "2027-09-10T09:40:00+05:30", notes: "—" },
  { plot_flat: "Villa 7", donor_name: "Anil & Kavitha Goud", amount: 51000, received_at: "2027-09-10T09:50:00+05:30", notes: "Annadanam support" },
  { plot_flat: "412", donor_name: "Mahesh Chowdary", amount: 3001, received_at: "2027-09-10T10:00:00+05:30", notes: "—" },
  { plot_flat: "Villa 12", donor_name: "Rajesh Varma", amount: 21000, received_at: "2027-09-10T10:10:00+05:30", notes: "—" },
  { plot_flat: "110", donor_name: "Sai Krishna", amount: 1116, received_at: "2027-09-10T10:20:00+05:30", notes: "—" },
  { plot_flat: "101", donor_name: "Ramesh Kumar Reddy", amount: 25000, received_at: "2027-09-10T10:30:00+05:30", notes: "Family offering" },
];

export const referenceExpenseCategories = [
  { category: "Idol", amount: 50000 },
  { category: "Pandal", amount: 40000 },
  { category: "Prasadam", amount: 18000 },
  { category: "Pooja", amount: 12500 },
  { category: "Other", amount: 10000 },
];

export const referenceExpenseLedger = [
  { id: "expense-idol", category: "Idol", description: "Ganesh idol (eco-friendly)", paid_to: "Sri Vinayaka Arts", spent_at: "2027-08-20", amount: 50000 },
  { id: "expense-pandal", category: "Pandal", description: "Tent, stage & flooring", paid_to: "Sai Tent House", spent_at: "2027-08-22", amount: 40000 },
  { id: "expense-pooja", category: "Pooja", description: "Pooja samagri & flowers", paid_to: "Local market", spent_at: "2027-08-25", amount: 12500 },
  { id: "expense-prasadam", category: "Prasadam", description: "Daily prasadam", paid_to: "Annapurna Caterers", spent_at: "2027-08-27", amount: 18000 },
  { id: "expense-other", category: "Other", description: "Event logistics & supplies", paid_to: "Community vendors", spent_at: "2027-08-28", amount: 10000 },
];

export const referencePastAuctions = [
  { item: "Laddu", plot_flat: "Villa 5", winner: "Narasimha Rao", amount: 85000 },
  { item: "Kalasam", plot_flat: "219", winner: "Sunitha Devi", amount: 32000 },
];

export const referenceEvents = [
  { id: "event-install", starts_at: "2027-09-14T07:00:00+05:30", title: "Ganesh Prathistapana", description: "Idol installation & Pranaprathishta pooja", location: "Suryodaya Colony Mandapam", status: "DONE" },
  { id: "event-aarti", starts_at: "2027-09-15T08:00:00+05:30", title: "Morning Aarti", description: "Daily morning aarti with all residents", location: "Suryodaya Colony Mandapam", status: "LIVE NOW" },
  { id: "event-cultural", starts_at: "2027-09-16T18:30:00+05:30", title: "Kids Cultural Night", description: "Dance, songs & fancy dress by colony kids", location: "Suryodaya Colony Mandapam", status: "UPCOMING" },
  { id: "event-auction", starts_at: "2027-09-22T17:00:00+05:30", title: "Laddu & Kalasam Auction", description: "Grand auction at the mandapam", location: "Suryodaya Colony Mandapam", status: "UPCOMING" },
  { id: "event-immersion", starts_at: "2027-09-23T16:00:00+05:30", title: "Nimajjanam (Immersion)", description: "Shobha yatra & immersion procession", location: "Suryodaya Colony Mandapam", status: "UPCOMING" },
];
