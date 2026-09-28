# Faiz Fayez – Dry Fruits & Fresh Fruits Import / Export

Website for **Faiz Fayez**, importers and exporters of dry fruits and fresh fruits,
trading mainly with India.

The design takes its cues from the trade itself: the red cloth *bahi-khata* ledger
used by Indian traders, cream ruled paper, blue and red ledger inks, customs stamps,
and real photographs presented as numbered plates. Type is Rozha One and Hind (both
by the Indian Type Foundry) with IBM Plex Mono for figures, all self-hosted.

## Sections

1. **Hero**: headline, enquiry and partnership actions, headline figures
2. **The ledger**: tonnes imported, tonnes exported, orders completed, countries, and a year-by-year table with bars
3. **From the orchard to the crate**: photographs of the dry fruits and fresh fruits we trade
4. **Trade lanes**: import and export routes, with India at one end of each
5. **The house**: who we are and how we work
6. **Partnership**: for distributors, wholesalers, retailers, manufacturers and overseas traders
7. **Write to us**: inquiry and partnership emails, plus an enquiry slip that opens the visitor's email app with the message written out and addressed to the right inbox

## Editing the content

Everything is in **`src/data/site.js`**:

| What | Where |
|---|---|
| Name, emails, phone, WhatsApp, city, hours | `company` |
| Imported / exported / orders / countries | `ledger` |
| Year-by-year table | `tradeByYear` |
| Trade lanes | `lanes` |
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
