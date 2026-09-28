# Faiz Fayez – Dry Fruits & Fresh Fruits Import / Export

Website for **Faiz Fayez**, importers and exporters of dry fruits and fresh fruits,
trading mainly with India.

## What's on the site

- **Hero**: headline, "Send an Inquiry" and "Become a Partner" buttons, and a mixed dry-fruit bowl
- **Our trade in numbers**: tonnes imported, tonnes exported, orders completed and countries served (animated counters), plus a year-by-year import vs export chart
- **About**: who we are and how we work
- **Products**: dry fruits and fresh fruits, each with a picture and an "Inquire" button
- **Where we trade**: India at the centre, with import and export routes to partner countries
- **How it works**: the ordering process
- **Business partnership**: section for distributors, wholesalers and bulk buyers
- **Contact**: separate emails for inquiries and partnerships, plus an inquiry form that opens the visitor's email app with the message already written

## Editing the content

All business details are in **`src/data/site.js`**:

| What | Where |
|---|---|
| Company name, emails, phone, WhatsApp, address | `company` |
| Imported / exported / orders / countries figures | `stats` |
| Yearly import vs export chart | `tradeByYear` |
| Dry fruits and fresh fruits | `dryFruits`, `freshFruits` |
| Trade partner countries | `countries` |

> The emails, phone number and trade figures are **placeholders**. Replace them with your real details before going live.

### Adding real product photos

Every product has a built-in illustration. To show a real photo instead, put the image in
`public/images/` (for example `public/images/almonds.jpg`) and set that product's `photo`
field in `src/data/site.js`:

```js
{ name: 'Almonds', art: 'almond', ..., photo: '/images/almonds.jpg' },
```

## Running locally

```bash
npm install
npm run dev      # development server
npm run build    # production build in dist/
```

The site deploys to Vercel as a static Vite app (see `vercel.json`).
