# Faiz Fayez – Dry Fruits & Fresh Fruits Import / Export

Business website for **Faiz Fayez**, a dry fruit and fresh fruit trading company in
**Kandahar, Afghanistan**. Its main job is to show buyers and partners the company’s trade
record: how many tonnes were exported and imported, how many orders were completed, and
where the goods went. There is an **admin panel** at `/admin` for editing everything
without touching code.

## The website

- **Top banner**: headline, “Request a Quote” / “Become a Partner”, and a card with the total tonnes shipped, the yearly trend and growth
- **Track record**: totals, tonnes shipped per year (exported vs imported), and the split by product and by country
- **Recent shipments**: the latest consignments, with date, product, tonnes, route and transport
- **What we trade**: product photos with tonnes shipped and season; click one to ask for a price
- **Where we ship**: a map of the routes from Kandahar, the top destinations, and air / road / sea / rail
- **About**, **Questions & answers**, **Certifications** and **Testimonials** (hidden until you add real ones)
- **Partnership banner** and **inquiry form**, plus a floating WhatsApp button

Every number on the site is worked out from the **trade records** entered in the admin panel,
so the totals, chart, map and “recent shipments” always agree with each other. While the
example records are still in place, the site shows a small “example figures” note.

The page is pre-rendered at build time and kept light (about 100 KB in total, self-hosted
font, no large libraries), so it loads quickly on slow mobile connections, is fully readable
by Google, and shows the right title and picture when the link is shared on WhatsApp.

## The admin panel (`/admin`)

- **Dashboard**: the current totals and one-click shortcuts (add a shipment, paste from Excel, change photos, …)
- **Trade records**: one row per shipment (date like `2026-09`) or per yearly total (date like `2025`).
  Add rows one by one, or **paste many rows from Excel / Google Sheets** in the order
  Date, Product, Country, Export/Import, Tonnes, Orders, Transport. Rows can be searched,
  filtered by year and **downloaded as a CSV** file for Excel. Totals from before the
  records can be added in **Totals from before these records**.
- **Products**, **Company & contact** (name, logo, emails, phone, WhatsApp, address, hours)
- Every section’s **texts, photos and lists**, including the map’s home city and shipping methods
- **Sections & menu** (show/hide and reorder), **Colours & fonts**, **Google & sharing**, and **Backup** (download or restore all content)

Changes show in a **live preview** (desktop and phone) as you type. Nothing goes live until
you press **Publish**. Unpublished edits are kept in your browser if you close the tab.

**How publishing works:** pressing Publish saves the content to this GitHub repository
(`src/content/site.json`, and uploaded photos in `public/uploads/`). Vercel sees the change
and rebuilds the website, which takes about **1–2 minutes**. Every publish is a separate
entry in the GitHub history, so any earlier version can be recovered.

Photos are resized in the browser before upload, so phone photos of any size can be used.

## One-time setup on Vercel

In Vercel, open the project → **Settings → Environment Variables**, and add:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | The password for the admin panel. Use a long one. |
| `GITHUB_TOKEN` | A GitHub token that can save changes (see below). |

Then **redeploy** (Deployments → ⋯ → Redeploy) so the new settings take effect.

**Creating the GitHub token:** on GitHub go to **Settings → Developer settings → Personal
access tokens → Fine-grained tokens → Generate new token**.
- Resource owner: **AmanatLogistics**
- Repository access: **Only select repositories → pdfedits**
- Permissions → Repository permissions → **Contents: Read and write**
- Pick an expiry date and remember to renew the token before it expires.

**Optional settings**

| Name | When to use it |
|---|---|
| `GITHUB_BRANCH` | The branch the admin saves to. By default it is the branch of the deployment you are on, so on the live site it saves to the production branch. |
| `GITHUB_REPO` | Only if the repository is not detected automatically, e.g. `AmanatLogistics/pdfedits`. |
| `RESEND_API_KEY` | Sends inquiry-form messages straight to your inbox (free account at resend.com). Without it, the form opens the visitor’s own email app with the message written out. |
| `INQUIRY_FROM` | The “from” address for inquiry emails, once your domain is verified in Resend, e.g. `Faiz Fayez Website <website@faizfayez.com>`. |

> **Which branch is live?** Vercel’s production deployments currently come from the
> `claude/browser-pdf-editor-vxtsac` branch (the old PDF editor). To make this website the
> live one, merge this branch into the production branch, or change **Settings → Git →
> Production Branch** in Vercel.

## Editing in code

All content lives in **`src/content/site.json`**; the admin panel edits the same file.

```bash
npm install
npm run dev      # website on http://localhost:5173, admin on /admin/ (password: admin)
npm run build    # production build in dist/
npm run lint
npm test         # admin API, inquiry form and trade-figure tests (no real GitHub needed)
```

The site is built with Preact. Icons come from Phosphor and are generated into
`src/site/ph.jsx` by `node scripts/build-icons.mjs`; add a name to the lists in that script
to use another icon.

In `npm run dev` the admin panel saves straight into the project files, so it can be tried
without GitHub. The default photos are free images from Pexels; replace them with your own
through the admin panel.
