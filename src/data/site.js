// ---------------------------------------------------------------------------
// Everything the website says about the business lives in this file.
// Emails, phone numbers and trade figures below are PLACEHOLDERS:
// replace them with the real ones before the site goes live.
// ---------------------------------------------------------------------------

export const company = {
  name: 'Faiz Fayez',
  since: 2014,
  city: 'New Delhi, India',
  // Prices, availability, orders, shipping
  email: 'info@faizfayez.com',
  // Distributors, wholesale, bulk contracts, private label
  partnershipEmail: 'partners@faizfayez.com',
  phone: '+91 00000 00000',
  // Digits only, with country code, for the WhatsApp link
  whatsapp: '910000000000',
  hours: 'Monday to Saturday, 9 am – 7 pm IST',
}

// Headline figures shown under the hero.
export const stats = [
  { key: 'imported', label: 'Tonnes imported', value: 12500, suffix: '+' },
  { key: 'exported', label: 'Tonnes exported', value: 9800, suffix: '+' },
  { key: 'orders', label: 'Orders completed', value: 3450, suffix: '+' },
  { key: 'countries', label: 'Countries served', value: 18, suffix: '' },
]

// Year-by-year volumes in tonnes.
export const tradeByYear = [
  { year: 2021, imported: 1650, exported: 1200 },
  { year: 2022, imported: 2100, exported: 1550 },
  { year: 2023, imported: 2550, exported: 1950 },
  { year: 2024, imported: 2900, exported: 2300 },
  { year: 2025, imported: 3300, exported: 2800 },
]

// Main trade lanes, India at one end of almost every one.
export const lanes = [
  { from: 'Afghanistan', to: 'India', dir: 'Import', goods: 'Almonds, raisins, figs, apricots' },
  { from: 'Iran', to: 'India', dir: 'Import', goods: 'Pistachios, dates, raisins' },
  { from: 'USA', to: 'India', dir: 'Import', goods: 'California almonds, walnuts' },
  { from: 'Gulf states', to: 'India', dir: 'Import', goods: 'Dates' },
  { from: 'India', to: 'Gulf states', dir: 'Export', goods: 'Mangoes, pomegranates, grapes, cashews' },
  { from: 'India', to: 'United Kingdom', dir: 'Export', goods: 'Alphonso & Kesar mangoes' },
  { from: 'India', to: 'Bangladesh · Nepal', dir: 'Export', goods: 'Apples, kinnow, grapes' },
  { from: 'India', to: 'South-East Asia', dir: 'Export', goods: 'Pomegranates, cashews, raisins' },
]

// Real photographs, served from Pexels (free licence, no attribution needed).
// To use your own photo instead, put it in /public/images and set `src`,
// e.g. src: '/images/almonds.jpg'.
export const photos = {
  hero: { pexels: 5332498, alt: 'Dried fruits heaped on trays at a market stall' },
  bazaar: { pexels: 17870116, alt: 'Sacks of spices and dry goods at a New Delhi bazaar' },
  ship: { pexels: 2231744, alt: 'Aerial view of a cargo ship beside stacked containers' },
  truck: { pexels: 15733306, alt: 'A truck loaded with sacks on an Indian road' },
}

export const plates = [
  { pexels: 57042, name: 'Almonds', alt: 'Almonds in a white bowl' },
  { pexels: 12326584, name: 'Cashews', alt: 'Cashew nuts in a bowl' },
  { pexels: 634650, name: 'Pistachios', alt: 'A heap of pistachios in their shells' },
  { pexels: 1489291, name: 'Walnuts', alt: 'A pile of walnuts' },
  { pexels: 3993529, name: 'Dates', alt: 'Close-up of date fruits' },
  { pexels: 29060107, name: 'Dried apricots', alt: 'Dried apricots at a market' },
  { pexels: 6085951, name: 'Raisins', alt: 'Close-up of raisins' },
  { pexels: 30643513, name: 'Mangoes', alt: 'Ripe mangoes stacked at a market' },
  { pexels: 18523341, name: 'Pomegranates', alt: 'Red pomegranates piled at a market' },
]
