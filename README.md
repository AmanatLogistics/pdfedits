# Faiz Fayez – Dry Fruits & Fresh Fruits Import / Export

Website for **Faiz Fayez**, importers and exporters of dry fruits and fresh fruits,
trading mainly with India.

A bright, friendly design: white pages, rounded photos and cards, colourful fruit-toned highlights, and brown & gold as the brand colours. Fonts are Baloo 2 (headings) and Nunito (text), self-hosted.

## Sections

1. **Hero**: headline, "Send inquiry" and "Partner with us" buttons, round fruit photos
2. **Our numbers**: tonnes imported, tonnes exported, orders completed, countries, and an imports vs exports chart by year
3. **About us**: who we are and how we work
4. **Gallery**: photos of the dry fruits and fresh fruits we trade
5. **Where we trade**: what we import into India and export from India
6. **Partner with us**: for distributors, wholesalers, shops, food companies and overseas traders
7. **Contact**: inquiry and partnership emails, phone and WhatsApp, and an inquiry form that opens the visitor's email app with the message ready

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
