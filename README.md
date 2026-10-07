# Faiz Fayez – Dry Fruits & Fresh Fruits Import / Export

Business website for **Faiz Fayez**, with an **admin panel** at `/admin` for editing
everything on the site without touching code.

## The website

- **Top banner**: full-width photo, headline, “Request a Quote” and “Become a Partner”, key numbers (imported, exported, orders, countries)
- **About**, **Services**, **What we trade** (photo cards, click to ask for a quote)
- **Trade numbers chart**: imports vs exports by year, with totals and growth worked out automatically
- **Global reach map**: a world map with routes between India and every import and export country
- **How we work**, **Why choose us**, **Questions & answers**
- **Certifications** and **Testimonials** (hidden until you add real ones)
- **Partnership banner** and **Contact / inquiry form**, plus a floating WhatsApp button

The page is pre-rendered at build time, so it loads fast, is fully readable by Google, and
shows the right title, description and picture when the link is shared on WhatsApp or LinkedIn.

## The admin panel (`/admin`)

Everything on the website can be changed from the admin panel:

- **Company & contact**: name, logo, emails, phone, WhatsApp, address, hours, map
- **Colours & fonts**
- **Sections & menu**: show/hide any section, change the order, choose what is in the top menu
- Every section’s **texts, photos, lists and numbers** (add, remove and reorder items)
- **Google & sharing** settings, and **Backup** (download or restore all content)

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
```

In `npm run dev` the admin panel saves straight into the project files, so it can be tried
without GitHub. The default photos are free images from Pexels; replace them with your own
through the admin panel.
