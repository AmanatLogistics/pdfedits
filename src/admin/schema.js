import {
  Building2, CircleHelp, Database, FileSpreadsheet, Files, Globe2, Hash, Image, Images, LayoutDashboard, Mail, Megaphone,
  MessageSquareQuote, Palette, PanelBottom, PanelTop, Search, ShieldCheck, Sparkles, Truck,
} from 'lucide-react'
import { FONT_OPTIONS } from '../site/theme.js'
import { ICONS, TRANSPORT } from '../site/icons.jsx'
import { COUNTRY_NAMES } from '../site/countries.js'

const iconOptions = Object.entries(ICONS).map(([value, { label }]) => ({ value, label }))
const transportOptions = Object.entries(TRANSPORT).map(([value, { label }]) => ({ value, label }))
const fontOptions = FONT_OPTIONS.map((f) => ({ value: f, label: f }))
const placeOptions = COUNTRY_NAMES.map((c) => ({ value: c, label: c }))

const heading = (path, { text = true } = {}) => [
  { path: `${path}.eyebrow`, type: 'text', label: 'Small label above the title' },
  { path: `${path}.title`, type: 'text', label: 'Title' },
  ...(text ? [{ path: `${path}.text`, type: 'textarea', label: 'Introduction text' }] : []),
]
const show = (id) => ({ type: 'sectionToggle', section: id, label: 'Show this section on the website' })

// Every admin page: what it edits and which part of the preview it shows.
// Pages with `special` have their own editor in AdminApp.jsx.
export const PAGES = [
  { id: 'dashboard', group: 'Start here', title: 'Dashboard', icon: LayoutDashboard, preview: 'record', special: 'dashboard' },
  {
    id: 'records', group: 'Start here', title: 'Trade records', icon: FileSpreadsheet, preview: 'record', special: 'records',
    intro: 'Every shipment or yearly total you add here updates the whole website automatically: the big totals, the yearly chart, the product list, recent shipments and the map.',
  },
  {
    id: 'products', group: 'Start here', title: 'Products & photos', icon: Image, preview: 'products',
    intro: 'The products shown on the website. Tons shipped are worked out from your trade records, so use the same product names in both places.',
    fields: [
      show('products'),
      ...heading('products'),
      {
        path: 'products.items', type: 'list', label: 'Products', itemLabel: 'Product', titleKey: 'title',
        newItem: { title: 'New product', tag: 'Dry fruit', season: 'All year', image: { src: '', alt: '' } },
        fields: [
          { key: 'image', type: 'image', label: 'Photo' },
          { key: 'title', type: 'text', label: 'Name' },
          { key: 'tag', type: 'text', label: 'Category', help: 'For the filter buttons, e.g. “Dry fruit”, “Fresh fruit” or “Imported”.' },
          { key: 'season', type: 'text', label: 'Season', help: 'For example “All year” or “Sep – Jan”.' },
        ],
      },
    ],
  },
  {
    id: 'company', group: 'Start here', title: 'Company & contact', icon: Building2, preview: 'contact',
    intro: 'Your business name, logo, email addresses and phone numbers. These appear in the header, contact section and footer.',
    fields: [
      { path: 'company.name', type: 'text', label: 'Company name', required: true },
      { path: 'company.tagline', type: 'text', label: 'Line under the name', help: 'For example “Dry & Fresh Fruit Traders”. “LTD” at the end of the name is shown smaller, next to it.' },
      { path: 'company.logo', type: 'imageSrc', label: 'Logo image', help: 'Optional. Without a logo image, the Faiz Fayez pomegranate emblem is shown next to the name.' },
      { path: 'company.since', type: 'number', label: 'Year established' },
      { path: 'company.email', type: 'email', label: 'Inquiry email', help: 'Price requests, orders and general inquiries go here.' },
      { path: 'company.partnershipEmail', type: 'email', label: 'Partnership email', help: 'Business partnership proposals go here.' },
      { path: 'company.phone', type: 'text', label: 'Phone number' },
      { path: 'company.whatsapp', type: 'text', label: 'WhatsApp number', help: 'Digits only, with country code. Example: 93701234567' },
      { path: 'company.address', type: 'textarea', label: 'Office address' },
      { path: 'company.hours', type: 'text', label: 'Business hours' },
      { path: 'company.mapEmbedUrl', type: 'url', label: 'Google Maps embed link', help: 'Optional. In Google Maps choose Share → Embed a map, and paste only the link inside src="…".' },
    ],
  },

  {
    id: 'hero', group: 'Website sections', title: 'Top banner', icon: PanelTop, preview: 'top',
    intro: 'The first thing visitors see: the large photo, headline, buttons and the total-shipped card.',
    fields: [
      { path: 'hero.image', type: 'image', label: 'Background photo', help: 'A wide landscape photo works best (at least 1600 px wide).' },
      { path: 'hero.eyebrow', type: 'text', label: 'Small label above the headline' },
      { path: 'hero.title', type: 'textarea', label: 'Headline', rows: 2 },
      { path: 'hero.text', type: 'textarea', label: 'Text under the headline' },
      { path: 'hero.primaryButton', type: 'text', label: 'Main button text', help: 'Opens the inquiry form. Also used for the button in the top menu.' },
      { path: 'hero.secondaryButton', type: 'text', label: 'Second button text', help: 'Opens the form with “Business partnership” selected. Leave empty to hide.' },
      { path: 'hero.trustPoints', type: 'stringList', label: 'Short trust points', addLabel: 'Add point' },
      { path: 'hero.cardTitle', type: 'text', label: 'Title of the total-shipped card' },
    ],
  },
  {
    id: 'record', group: 'Website sections', title: 'Track record', icon: Hash, preview: 'record',
    intro: 'The texts around your trade figures. The numbers themselves come from Trade records.',
    fields: [
      show('record'),
      ...heading('record'),
      { path: 'record.chartTitle', type: 'text', label: 'Chart title' },
      { path: 'record.productsTitle', type: 'text', label: 'Title of the product list' },
      { path: 'record.transportTitle', type: 'text', label: 'Title of the transport list', help: 'Shown when all your records go to one country.' },
      { path: 'record.countriesTitle', type: 'text', label: 'Title of the country list', help: 'Shown when your records include more than one country.' },
      { path: 'record.unit', type: 'text', label: 'Unit name', help: 'Shown after every amount on the website, e.g. “Tons”.' },
      { path: 'statLabels.shipped', type: 'text', label: 'Name for total shipped' },
      { path: 'statLabels.exported', type: 'text', label: 'Name for exported' },
      { path: 'statLabels.imported', type: 'text', label: 'Name for imported' },
      { path: 'statLabels.orders', type: 'text', label: 'Name for orders' },
      { path: 'statLabels.years', type: 'text', label: 'Name for years in trade' },
      { path: 'statLabels.countries', type: 'text', label: 'Name for countries' },
    ],
  },
  {
    id: 'shipments', group: 'Website sections', title: 'Recent shipments', icon: Truck, preview: 'shipments',
    intro: 'Shows your newest trade records that have a month (for example 2026-09). Add them in Trade records.',
    fields: [
      show('shipments'),
      ...heading('shipments'),
      { path: 'shipments.count', type: 'number', label: 'How many to show on the home page' },
      { path: 'shipments.pageCount', type: 'number', label: 'How many to show on the Track Record page' },
    ],
  },
  {
    id: 'gallery', group: 'Website sections', title: 'Photo gallery', icon: Images, preview: 'gallery',
    intro: 'A grid of photos on the home page and the Products page. The first photo is shown large. Photos of your own warehouse, packing and shipments work best.',
    fields: [
      show('gallery'),
      ...heading('gallery'),
      {
        path: 'gallery.items', type: 'list', label: 'Photos', itemLabel: 'Photo', titleKey: 'caption',
        newItem: { image: { src: '', alt: '' }, caption: '' },
        fields: [
          { key: 'image', type: 'image', label: 'Photo' },
          { key: 'caption', type: 'text', label: 'Caption' },
        ],
      },
    ],
  },
  {
    id: 'destinations', group: 'Website sections', title: 'Shipping & map', icon: Globe2, preview: 'destinations',
    intro: 'The map draws a route from your home city to the countries in your trade records, thicker for bigger volumes, and lists how your goods travel.',
    fields: [
      show('destinations'),
      ...heading('destinations'),
      { path: 'destinations.hub', type: 'select', label: 'Home city (centre of the map)', options: placeOptions },
      {
        path: 'destinations.routes', type: 'list', label: 'How you ship', itemLabel: 'Shipping method', titleKey: 'title',
        newItem: { icon: 'road', title: 'New route', text: '' },
        fields: [
          { key: 'icon', type: 'select', label: 'Icon', options: transportOptions },
          { key: 'title', type: 'text', label: 'Title' },
          { key: 'text', type: 'textarea', label: 'Description' },
        ],
      },
    ],
  },
  {
    id: 'about', group: 'Website sections', title: 'About us', icon: Sparkles, preview: 'about',
    fields: [
      show('about'),
      ...heading('about', { text: false }),
      { path: 'about.lead', type: 'textarea', label: 'First paragraph (larger)' },
      { path: 'about.text', type: 'textarea', label: 'Second paragraph' },
      {
        path: 'about.points', type: 'list', label: 'Strengths', itemLabel: 'Strength', titleKey: 'title',
        newItem: { icon: 'quality', title: 'New point', text: '' },
        fields: [
          { key: 'icon', type: 'select', label: 'Icon', options: iconOptions },
          { key: 'title', type: 'text', label: 'Title' },
          { key: 'text', type: 'textarea', label: 'Description' },
        ],
      },
      { path: 'about.steps', type: 'stringList', label: 'How ordering works (steps)', addLabel: 'Add step' },
      { path: 'about.badgeText', type: 'text', label: 'Years badge text', help: 'Shown under the number of years since you were established.' },
      { path: 'about.image', type: 'image', label: 'Main photo' },
      { path: 'about.image2', type: 'image', label: 'Small photo', help: 'Optional second photo overlapping the main one.' },
    ],
  },
  {
    id: 'certifications', group: 'Website sections', title: 'Certifications', icon: ShieldCheck, preview: 'certifications',
    intro: 'Licences and registrations, such as your Afghan Chamber of Commerce membership or export licence. The section appears once you add at least one and switch it on.',
    fields: [
      show('certifications'),
      ...heading('certifications'),
      {
        path: 'certifications.items', type: 'list', label: 'Certificates', itemLabel: 'Certificate', titleKey: 'name',
        newItem: { name: 'New certificate', number: '', link: '', image: { src: '', alt: '' } },
        fields: [
          { key: 'name', type: 'text', label: 'Name' },
          { key: 'number', type: 'text', label: 'Registration number' },
          { key: 'image', type: 'image', label: 'Logo or certificate image' },
          { key: 'link', type: 'url', label: 'Link to verify or download (optional)' },
        ],
      },
    ],
  },
  {
    id: 'testimonials', group: 'Website sections', title: 'Testimonials', icon: MessageSquareQuote, preview: 'testimonials',
    intro: 'Quotes from real customers. The section appears once you add at least one and switch it on.',
    fields: [
      show('testimonials'),
      ...heading('testimonials', { text: false }),
      {
        path: 'testimonials.items', type: 'list', label: 'Testimonials', itemLabel: 'Testimonial', titleKey: 'name',
        newItem: { quote: '', name: '', role: '', company: '' },
        fields: [
          { key: 'quote', type: 'textarea', label: 'What they said' },
          { key: 'name', type: 'text', label: 'Name' },
          { key: 'role', type: 'text', label: 'Job title' },
          { key: 'company', type: 'text', label: 'Company and country' },
        ],
      },
    ],
  },
  {
    id: 'faq', group: 'Website sections', title: 'Questions & answers', icon: CircleHelp, preview: 'faq',
    fields: [
      show('faq'),
      ...heading('faq', { text: false }),
      {
        path: 'faq.items', type: 'list', label: 'Questions', itemLabel: 'Question', titleKey: 'q',
        newItem: { q: 'New question', a: '' },
        fields: [
          { key: 'q', type: 'text', label: 'Question' },
          { key: 'a', type: 'textarea', label: 'Answer' },
        ],
      },
    ],
  },
  {
    id: 'contact', group: 'Website sections', title: 'Contact & partnership', icon: Mail, preview: 'contact',
    intro: 'The partnership banner, the contact section and the inquiry form. Inquiry types marked as partnership go to the partnership email; all others go to the inquiry email.',
    fields: [
      { path: 'contact.partnerTitle', type: 'text', label: 'Partnership banner title', help: 'Leave empty to hide the banner.' },
      { path: 'contact.partnerText', type: 'textarea', label: 'Partnership banner text' },
      { path: 'contact.partnerButton', type: 'text', label: 'Partnership button text' },
      ...heading('contact'),
      {
        path: 'contact.inquiryTypes', type: 'list', label: 'Inquiry types', itemLabel: 'Type', titleKey: 'label', compact: true,
        newItem: { label: 'New inquiry type', partnership: false },
        fields: [
          { key: 'label', type: 'text', label: 'Name' },
          { key: 'partnership', type: 'toggle', label: 'Send to the partnership email' },
        ],
      },
      { path: 'contact.submitLabel', type: 'text', label: 'Send button text' },
      { path: 'contact.successMessage', type: 'textarea', label: 'Message after sending' },
    ],
  },
  {
    id: 'cta', group: 'Website sections', title: 'Closing banner', icon: Megaphone, preview: 'cta', sitePage: 'track-record',
    intro: 'The banner at the bottom of every page except the home page and Contact page, inviting visitors to request a quote.',
    fields: [
      { path: 'cta.title', type: 'text', label: 'Title' },
      { path: 'cta.text', type: 'textarea', label: 'Text' },
      { path: 'cta.button', type: 'text', label: 'Button text' },
    ],
  },
  {
    id: 'footer', group: 'Website sections', title: 'Footer & WhatsApp', icon: PanelBottom, preview: 'footer',
    fields: [
      { path: 'footer.about', type: 'textarea', label: 'Footer description' },
      { path: 'footer.copyright', type: 'text', label: 'Text after the copyright line' },
      { path: 'whatsappButton.enabled', type: 'toggle', label: 'Show the floating WhatsApp button' },
      { path: 'whatsappButton.message', type: 'text', label: 'Pre-filled WhatsApp message' },
    ],
  },

  {
    id: 'pages', group: 'Start here', title: 'Pages & menu', icon: Files, preview: null, special: 'pages',
    intro: 'The website has a home page with every section, plus a page for each topic. Edit each page’s menu name, banner text and photo, and choose the order of sections on the home page.',
  },
  {
    id: 'theme', group: 'Design & settings', title: 'Colours & fonts', icon: Palette, preview: 'record',
    intro: 'The brand colours and typefaces used across the whole website.',
    fields: [
      { path: 'theme.primary', type: 'color', label: 'Main brand colour', help: 'The logo background, icons, the total-shipped tile and the banners.' },
      { path: 'theme.accent', type: 'color', label: 'Highlight colour', help: 'Main buttons, small labels, the map routes and highlights.' },
      { path: 'theme.dark', type: 'color', label: 'Dark background colour', help: 'Top banner, map section and footer.' },
      { path: 'theme.exportColor', type: 'color', label: 'Chart colour: exports' },
      { path: 'theme.importColor', type: 'color', label: 'Chart colour: imports' },
      { path: 'theme.headingFont', type: 'select', label: 'Heading font', options: fontOptions, help: 'Manrope is built in and loads fastest.' },
      { path: 'theme.bodyFont', type: 'select', label: 'Text font', options: fontOptions },
    ],
  },
  {
    id: 'seo', group: 'Design & settings', title: 'Google & sharing', icon: Search, preview: null,
    intro: 'How the website appears in Google results and when the link is shared on WhatsApp, LinkedIn or Facebook.',
    fields: [
      { path: 'meta.title', type: 'text', label: 'Page title', help: 'Shown in the browser tab and as the Google result headline. About 50–60 characters.', counter: 60 },
      { path: 'meta.description', type: 'textarea', label: 'Description', help: 'Shown under the title in Google. About 150–160 characters.', counter: 160 },
      { path: 'meta.siteUrl', type: 'url', label: 'Website address', help: 'Your final domain, e.g. https://www.faizfayez.com. Used for link previews and the sitemap.' },
      { path: 'meta.shareImage', type: 'imageSrc', label: 'Share picture', help: 'Shown when the link is shared. Leave empty to use the top banner photo.' },
    ],
    seoPreview: true,
  },
  { id: 'backup', group: 'Design & settings', title: 'Backup', icon: Database, preview: null, special: 'backup', intro: 'Download a copy of all website content, or restore one.' },
]
