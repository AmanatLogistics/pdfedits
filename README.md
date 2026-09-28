# Faiz Fayez – Dry Fruits & Fresh Fruits Import / Export

Website for **Faiz Fayez**, importers and exporters of dry fruits and fresh fruits,
trading mainly with India.

A professional B2B trading-company layout: top contact bar, full-width photo hero, key figures band, services, trade performance chart, global reach, partnership and quote request. Brand colours are brown and gold; fonts are Montserrat (headings) and Open Sans (text), self-hosted.

## Sections

1. **Hero**: headline, "Request a Quote" and "Become a Partner", key figures (imported, exported, orders, countries)
2. **About Us**
3. **Services**: import, export, sourcing, quality control, packing, documentation & logistics
4. **Trade Performance**: imports vs exports chart by year
5. **Global Reach**: what we import into India and export from India
6. **What We Trade**: photos of the produce
7. **Why Choose Us**
8. **Business Partnership**
9. **Contact**: inquiry and partnership emails, phone, WhatsApp and a quote request form that opens the visitor's email app

## Editing the content

Everything is in **`src/data/site.js`**:

| What | Where |
|---|---|
| Name, emails, phone, WhatsApp, city, hours | `company` |
| Imported / exported / orders / countries | `stats` |
| Year-by-year chart | `tradeByYear` |
| Import and export routes | `lanes` |
| Photographs | `photos`, `plates` |

> The emails, phone number and all figures are **placeholders**. Replace them with the real ones before going live.

### Photographs

The photos are free-licence images served from Pexels. To use your own, put the file in
`public/images/` and give that entry a `src`:

```js
{ name: 'Almonds', alt: 'Almonds in a bowl', src: '/images/almonds.jpg' },
```

## Running locally

```bash
npm install
npm run dev      # development server
npm run build    # production build in dist/
```

Deploys to Vercel as a static Vite app (see `vercel.json`).
