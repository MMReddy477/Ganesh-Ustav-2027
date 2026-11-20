-- Optional starter records matching the supplied public-page reference.
-- Confirm donor display consent and account figures before running in production.
insert into public.sponsors (id, name, tier, plot_flat, contribution_amount, sort_order, is_published)
values
  ('00000000-0000-4000-8000-000000000101', 'Krishna Murthy & Family', 'Ganesh Idol Sponsor', 'Villa 7', 75000, 1, true),
  ('00000000-0000-4000-8000-000000000102', 'Rani Teja Constructions', 'Mandap Decoration', 'Plot/Flat 208', 35000, 2, true),
  ('00000000-0000-4000-8000-000000000103', 'Sridevi & Prakash', 'Annaprasadam', 'Plot/Flat 301', 20000, 3, true),
  ('00000000-0000-4000-8000-000000000104', 'Naveen Electricals', 'Sound & Lighting', 'Plot/Flat 115', 15000, 4, true)
on conflict (id) do nothing;

insert into public.auction_items (
  id, title, auction_type, festival_year, plot_flat, winning_amount, winner_name, winner_consent, is_published
) values
  ('00000000-0000-4000-8000-000000000301', 'Laddu', 'laddu', 2026, 'Villa 5', 85000, 'Narasimha Rao', true, true),
  ('00000000-0000-4000-8000-000000000302', 'Kalasam', 'kalasam', 2026, '219', 32000, 'Sunitha Devi', true, true)
on conflict (id) do nothing;

insert into public.donations (id, plot_flat, donor_name, amount, payment_method, received_at, notes, show_on_wall)
values
  ('00000000-0000-4000-8000-000000000201', '102', 'Srinivas Rao', 11116, 'UPI', '2027-09-10T09:00:00+05:30', null, true),
  ('00000000-0000-4000-8000-000000000202', '203', 'Lakshmi Narayana', 5001, 'UPI', '2027-09-10T09:10:00+05:30', null, true),
  ('00000000-0000-4000-8000-000000000203', '204', 'Venkatesh Sharma', 10001, 'UPI', '2027-09-10T09:20:00+05:30', 'In memory of parents', true),
  ('00000000-0000-4000-8000-000000000204', '305', 'Padma Priya', 2116, 'UPI', '2027-09-10T09:30:00+05:30', null, true),
  ('00000000-0000-4000-8000-000000000205', '306', 'Suresh Babu', 15000, 'UPI', '2027-09-10T09:40:00+05:30', null, true),
  ('00000000-0000-4000-8000-000000000206', 'Villa 7', 'Anil & Kavitha Goud', 51000, 'UPI', '2027-09-10T09:50:00+05:30', 'Annadanam support', true),
  ('00000000-0000-4000-8000-000000000207', '412', 'Mahesh Chowdary', 3001, 'UPI', '2027-09-10T10:00:00+05:30', null, true),
  ('00000000-0000-4000-8000-000000000208', 'Villa 12', 'Rajesh Varma', 21000, 'UPI', '2027-09-10T10:10:00+05:30', null, true),
  ('00000000-0000-4000-8000-000000000209', '110', 'Sai Krishna', 1116, 'UPI', '2027-09-10T10:20:00+05:30', null, true),
  ('00000000-0000-4000-8000-000000000210', '101', 'Ramesh Kumar Reddy', 25000, 'UPI', '2027-09-10T10:30:00+05:30', 'Family offering', true)
on conflict (id) do nothing;

insert into public.expenses (id, category, description, paid_to, amount, spent_at)
values
  ('00000000-0000-4000-8000-000000000301', 'Idol', 'Ganesh idol (eco-friendly)', 'Sri Vinayaka Arts', 50000, '2027-08-20'),
  ('00000000-0000-4000-8000-000000000302', 'Pandal', 'Tent, stage & flooring', 'Sai Tent House', 40000, '2027-08-22'),
  ('00000000-0000-4000-8000-000000000303', 'Pooja', 'Pooja samagri & flowers', 'Local market', 12500, '2027-08-25'),
  ('00000000-0000-4000-8000-000000000304', 'Prasadam', 'Daily prasadam', 'Annapurna Caterers', 18000, '2027-08-27'),
  ('00000000-0000-4000-8000-000000000305', 'Other', 'Event logistics & supplies', 'Community vendors', 10000, '2027-08-28')
on conflict (id) do nothing;

insert into public.events (id, title, description, location, starts_at, is_published)
values
  ('00000000-0000-4000-8000-000000000401', 'Ganesh Prathistapana', 'Idol installation & Pranaprathishta pooja', 'Suryodaya Colony Mandapam', '2027-09-14T07:00:00+05:30', true),
  ('00000000-0000-4000-8000-000000000402', 'Morning Aarti', 'Daily morning aarti with all residents', 'Suryodaya Colony Mandapam', '2027-09-15T08:00:00+05:30', true),
  ('00000000-0000-4000-8000-000000000403', 'Kids Cultural Night', 'Dance, songs & fancy dress by colony kids', 'Suryodaya Colony Mandapam', '2027-09-16T18:30:00+05:30', true),
  ('00000000-0000-4000-8000-000000000404', 'Laddu & Kalasam Auction', 'Grand auction at the mandapam', 'Suryodaya Colony Mandapam', '2027-09-22T17:00:00+05:30', true),
  ('00000000-0000-4000-8000-000000000405', 'Nimajjanam (Immersion)', 'Shobha yatra & immersion procession', 'Suryodaya Colony Mandapam', '2027-09-23T16:00:00+05:30', true)
on conflict (id) do nothing;
