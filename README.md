# Faiz Fayez – Dry Fruits & Fresh Fruits Import / Export

Business website for **Faiz Fayez LTD**, a dry fruit and fresh fruit trading company in
**Kandahar, Afghanistan**. Its main job is to show buyers and partners the company’s trade
record: how many tons were exported and imported, how many orders were completed, and
where the goods went. There is an **admin panel** at `/admin` for editing everything
without touching code.

## The website

| Page | Address | What it shows |
|---|---|---|
| Home | `/` | Top banner with the total shipped, a card for each page, why buyers choose you, and how ordering works |
| Track Record | `/track-record` | Totals, tons shipped per year, by product and by transport, partners (e.g. Amanat Logistics) with the tons shipped together, and recent shipments |
| Products | `/products` | Product photos with tons shipped and season, and the photo gallery |
| Shipping | `/shipping` | The route map from Kandahar and the air, road and sea options |
| About | `/about` | About the company, certifications, testimonials, and questions & answers |
| Contact | `/contact` | Inquiry form, partnership banner, emails, phone and WhatsApp |

The home page is an overview with its own content; each detailed section appears only on its
own page. Moving between pages happens in place, without reloading. Clicking a product opens
the inquiry form with that product filled in. The logo is an “FF” monogram in a framed square,
drawn in the brand colours (it is also the browser-tab icon); an uploaded logo image replaces it.

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
  Date, Product, Country, Export/Import, Tons, Orders, Transport. Rows can be searched,
  filtered by year and **downloaded as a CSV** file for Excel. Totals from before the
  records can be added in **Totals from before these records**.
- **Track record** page also holds the **partners** (such as Amanat Logistics) with the amounts shipped together per product
- **Products**, **Company & contact** (name, logo, emails, phone, WhatsApp, address, hours)
- **Home page**: the page cards (photo, text, highlight), why choose us, and how ordering works
- **Pages & menu**: each page’s menu name, banner title, text and photo; which pages are in the
  top menu; and which sections are shown, in what order
- Every section’s **texts, photos and lists**: top banner, track record (including the unit
  name, “Tons”), recent shipments, photo gallery, shipping & map, about, FAQ, contact,
  closing banner and footer
- **Buttons & small texts**: every button, form label and small heading on the website
- **Colours & fonts**, **Google & sharing**, and **Backup** (download or restore all content)

Changes show in a **live preview** (desktop and phone) as you type; links in the preview move between pages. Nothing goes live until
you press **Publish**. Unpublished edits are kept in your browser if you close the tab.

**How publishing works:** pressing Publish saves the content to this GitHub repository
(`src/content/site.json`, and uploaded photos in `public/uploads/`). Vercel sees the change
and rebuilds the website, which takes about **1–2 minutes**. Every publish is a separate
entry in the GitHub history, so any earlier version can be recovered.

Photos are resized in the browser before upload, so phone photos of any size can be used.
Instead of uploading, you can also **paste a photo link** into any photo box: a direct image
address from any website (in Google Images, open the photo, right-click it and choose “Copy
image address”), or a link to a photo page on Pexels or Unsplash, which is converted to the
photo itself. The admin panel warns when a link does not show a picture or the picture is too
small to look sharp.

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
