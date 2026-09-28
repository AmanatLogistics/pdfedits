// ---------------------------------------------------------------------------
// All of the business details shown on the website live in this one file.
// Update the emails, phone numbers and figures below and the whole site
// follows. The trade figures are PLACEHOLDERS – replace them with real numbers.
// ---------------------------------------------------------------------------

export const company = {
  name: 'Faiz Fayez',
  tagline: 'Dry Fruits & Fresh Fruits · Import & Export',
  since: 2014,
  // General customer / product / order inquiries
  email: 'info@faizfayez.com',
  // Business partnerships, distributors, wholesale & bulk buyers
  partnershipEmail: 'partners@faizfayez.com',
  phone: '+91 00000 00000',
  // Digits only, with country code – used for the WhatsApp link
  whatsapp: '910000000000',
  address: 'Head Office · New Delhi, India',
  hours: 'Mon – Sat · 9:00 AM – 7:00 PM (IST)',
}

// Headline counters in the "Our trade in numbers" section.
export const stats = [
  { key: 'imported', label: 'Tonnes imported', value: 12500, suffix: '+', note: 'Dry & fresh fruits brought in' },
  { key: 'exported', label: 'Tonnes exported', value: 9800, suffix: '+', note: 'Shipped to buyers abroad' },
  { key: 'orders', label: 'Orders completed', value: 3450, suffix: '+', note: 'Delivered on time, as agreed' },
  { key: 'countries', label: 'Countries served', value: 18, suffix: '', note: 'With India as our biggest market' },
]

// Year-by-year volumes (tonnes) for the import vs export chart.
export const tradeByYear = [
  { year: '2021', imported: 1650, exported: 1200 },
  { year: '2022', imported: 2100, exported: 1550 },
  { year: '2023', imported: 2550, exported: 1950 },
  { year: '2024', imported: 2900, exported: 2300 },
  { year: '2025', imported: 3300, exported: 2800 },
]

// `art` picks the built-in illustration. To use a real photo instead, put the
// file in /public/images and set `photo: '/images/your-file.jpg'`.
export const dryFruits = [
  { name: 'Almonds', art: 'almond', origin: 'California · Afghanistan', desc: 'Mamra, Gurbandi and California almonds — crunchy, sweet and graded by size.', photo: null },
  { name: 'Cashews', art: 'cashew', origin: 'India · Africa', desc: 'W180, W240 and W320 whole cashews, plus splits and pieces for industry.', photo: null },
  { name: 'Pistachios', art: 'pistachio', origin: 'Iran · USA', desc: 'Naturally opened, roasted and salted or raw kernels in bulk packs.', photo: null },
  { name: 'Walnuts', art: 'walnut', origin: 'Kashmir · Chile', desc: 'In-shell and light-halves walnut kernels with rich, buttery taste.', photo: null },
  { name: 'Raisins', art: 'raisin', origin: 'India · Afghanistan', desc: 'Golden, green and black raisins — cleaned, sorted and ready to pack.', photo: null },
  { name: 'Dates', art: 'date', origin: 'Saudi Arabia · UAE · Iran', desc: 'Medjool, Ajwa, Kimia and Safawi dates, fresh from the harvest.', photo: null },
  { name: 'Dried Apricots', art: 'apricot', origin: 'Turkey · Afghanistan', desc: 'Soft Turkish apricots and sun-dried Afghan khubani.', photo: null },
  { name: 'Dried Figs', art: 'fig', origin: 'Afghanistan · Turkey', desc: 'Naturally sweet anjeer, hand-picked and carefully dried.', photo: null },
]

export const freshFruits = [
  { name: 'Mangoes', art: 'mango', origin: 'India', desc: 'Alphonso, Kesar, Banganapalli and Dasheri — India’s pride, exported in season.', photo: null },
  { name: 'Pomegranates', art: 'pomegranate', origin: 'India · Afghanistan', desc: 'Bhagwa and Kandahari pomegranates with deep red, juicy arils.', photo: null },
  { name: 'Apples', art: 'apple', origin: 'Kashmir · Himachal · Iran', desc: 'Crisp Kashmiri and Himachali apples, plus imported varieties.', photo: null },
  { name: 'Grapes', art: 'grape', origin: 'India (Nashik)', desc: 'Thompson Seedless and black grapes, cold-chain packed for export.', photo: null },
  { name: 'Oranges & Kinnow', art: 'orange', origin: 'India · Egypt', desc: 'Punjab kinnow and Nagpur oranges — sweet, juicy and easy to peel.', photo: null },
  { name: 'Bananas', art: 'banana', origin: 'India', desc: 'Cavendish (G9) bananas, harvested at the right stage for shipping.', photo: null },
]

// Trade partners. `primary` highlights India as the main market.
export const countries = [
  { name: 'India', flows: ['Import', 'Export'], primary: true },
  { name: 'Afghanistan', flows: ['Import'] },
  { name: 'UAE', flows: ['Import', 'Export'] },
  { name: 'Iran', flows: ['Import'] },
  { name: 'Saudi Arabia', flows: ['Import', 'Export'] },
  { name: 'Turkey', flows: ['Import'] },
  { name: 'USA', flows: ['Import'] },
  { name: 'United Kingdom', flows: ['Export'] },
  { name: 'Bangladesh', flows: ['Export'] },
  { name: 'Nepal', flows: ['Export'] },
  { name: 'Sri Lanka', flows: ['Export'] },
  { name: 'Qatar', flows: ['Export'] },
  { name: 'Kuwait', flows: ['Export'] },
  { name: 'Oman', flows: ['Export'] },
  { name: 'Malaysia', flows: ['Export'] },
  { name: 'Singapore', flows: ['Export'] },
  { name: 'Chile', flows: ['Import'] },
  { name: 'Uzbekistan', flows: ['Import'] },
]
