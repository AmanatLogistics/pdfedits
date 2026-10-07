import {
  BarChart3, Building2, CircleHelp, Database, Globe2, Handshake, Hash, Image, LayoutList, Mail, MessageSquareQuote,
  Palette, PanelBottom, PanelTop, Search, ShieldCheck, Sparkles, Star, Workflow, Wrench,
} from 'lucide-react'
import { FONT_OPTIONS } from '../site/theme.js'
import { ICONS } from '../site/icons.jsx'
import { COUNTRY_NAMES } from '../site/countries.js'

const iconOptions = Object.entries(ICONS).map(([value, { label }]) => ({ value, label }))
const fontOptions = FONT_OPTIONS.map((f) => ({ value: f, label: f }))
const countryOptions = COUNTRY_NAMES.map((c) => ({ value: c, label: c }))

const heading = (path, extra = {}) => [
  { path: `${path}.eyebrow`, type: 'text', label: 'Small label above the title' },
  { path: `${path}.title`, type: 'text', label: 'Title' },
  ...(extra.text === false ? [] : [{ path: `${path}.text`, type: 'textarea', label: 'Introduction text' }]),
]
const show = (id) => ({ type: 'sectionToggle', section: id, label: 'Show this section on the website' })

// Every admin page: which settings it edits and which part of the preview it shows.
export const PAGES = [
  {
    id: 'company', group: 'Business details', title: 'Company & contact', icon: Building2, preview: 'contact',
    intro: 'Your business name, logo, email addresses and phone numbers. These appear in the header, contact section and footer.',
    fields: [
      { path: 'company.name', type: 'text', label: 'Company name', required: true },
      { path: 'company.tagline', type: 'text', label: 'Line under the name', help: 'For example “Import & Export”.' },
      { path: 'company.logo', type: 'imageSrc', label: 'Logo image', help: 'Optional. Without a logo the letters below are shown in a coloured square.' },
      { path: 'company.monogram', type: 'text', label: 'Logo letters', maxLength: 3 },
      { path: 'company.since', type: 'number', label: 'Year established' },
      { path: 'company.email', type: 'email', label: 'Inquiry email', help: 'Price requests, orders and general inquiries go here.' },
      { path: 'company.partnershipEmail', type: 'email', label: 'Partnership email', help: 'Business partnership proposals go here.' },
      { path: 'company.phone', type: 'text', label: 'Phone number' },
      { path: 'company.whatsapp', type: 'text', label: 'WhatsApp number', help: 'Digits only, with country code. Example: 919876543210' },
      { path: 'company.address', type: 'textarea', label: 'Office address' },
      { path: 'company.hours', type: 'text', label: 'Business hours' },
      { path: 'company.mapEmbedUrl', type: 'url', label: 'Google Maps embed link', help: 'Optional. In Google Maps choose Share → Embed a map, and paste only the link inside src="…".' },
    ],
  },
  {
    id: 'theme', group: 'Business details', title: 'Colours & fonts', icon: Palette, preview: 'top',
    intro: 'The brand colours and typefaces used across the whole website.',
    fields: [
      { path: 'theme.primary', type: 'color', label: 'Main brand colour', help: 'Buttons, icons and the partnership banner.' },
      { path: 'theme.accent', type: 'color', label: 'Highlight colour', help: 'Main buttons, small labels and highlights.' },
      { path: 'theme.dark', type: 'color', label: 'Dark background colour', help: 'Top banner shade, map section and footer.' },
      { path: 'theme.importColor', type: 'color', label: 'Chart colour: imports' },
      { path: 'theme.exportColor', type: 'color', label: 'Chart colour: exports' },
      { path: 'theme.headingFont', type: 'select', label: 'Heading font', options: fontOptions },
      { path: 'theme.bodyFont', type: 'select', label: 'Text font', options: fontOptions },
    ],
  },
  {
    id: 'sections', group: 'Website layout', title: 'Sections & menu', icon: LayoutList, preview: null,
    intro: 'Choose which sections appear, their order on the page, and which ones are linked in the top menu.',
    special: 'sections',
  },
  {
    id: 'hero', group: 'Website layout', title: 'Top banner', icon: PanelTop, preview: 'top',
    intro: 'The first thing visitors see: the large photo, headline and main buttons.',
    fields: [
      { path: 'hero.image', type: 'image', label: 'Background photo', help: 'A wide landscape photo works best (at least 1600 px wide).' },
      { path: 'hero.eyebrow', type: 'text', label: 'Small label above the headline' },
      { path: 'hero.title', type: 'textarea', label: 'Headline', rows: 2 },
      { path: 'hero.text', type: 'textarea', label: 'Text under the headline' },
      { path: 'hero.primaryButton', type: 'text', label: 'Main button text', help: 'Scrolls to the inquiry form.' },
      { path: 'hero.secondaryButton', type: 'text', label: 'Second button text', help: 'Opens the form with “Business partnership” selected. Leave empty to hide.' },
      { path: 'hero.trustPoints', type: 'stringList', label: 'Short trust points', addLabel: 'Add point' },
    ],
  },
  {
    id: 'stats', group: 'Website layout', title: 'Key numbers', icon: Hash, preview: 'top',
    intro: 'The figures shown at the bottom of the top banner: how much you imported, exported and delivered.',
    fields: [
      { path: 'hero.showStats', type: 'toggle', label: 'Show the numbers bar' },
      {
        path: 'stats', type: 'list', label: 'Numbers', itemLabel: 'Number', titleKey: 'label',
        newItem: { label: 'New figure', value: 0, suffix: '+' },
        fields: [
          { key: 'value', type: 'number', label: 'Number' },
          { key: 'suffix', type: 'text', label: 'After the number', help: 'For example “+” or “%”.' },
          { key: 'label', type: 'text', label: 'Label' },
        ],
      },
    ],
  },
  {
    id: 'about', group: 'Website layout', title: 'About us', icon: Sparkles, preview: 'about',
    fields: [
      show('about'),
      ...heading('about', { text: false }),
      { path: 'about.lead', type: 'textarea', label: 'First paragraph (larger)' },
      { path: 'about.text', type: 'textarea', label: 'Second paragraph' },
      { path: 'about.points', type: 'stringList', label: 'Checklist points', addLabel: 'Add point' },
      { path: 'about.button', type: 'text', label: 'Button text', help: 'Leave empty to hide the button.' },
      { path: 'about.badgeText', type: 'text', label: 'Years badge text', help: 'Shown under the number of years since you were established.' },
      { path: 'about.image', type: 'image', label: 'Main photo' },
      { path: 'about.image2', type: 'image', label: 'Small photo', help: 'Optional second photo overlapping the main one.' },
    ],
  },
  {
    id: 'services', group: 'Website layout', title: 'Services', icon: Wrench, preview: 'services',
    fields: [
      show('services'),
      ...heading('services'),
      {
        path: 'services.items', type: 'list', label: 'Services', itemLabel: 'Service', titleKey: 'title',
        newItem: { icon: 'badge', title: 'New service', text: '' },
        fields: [
          { key: 'icon', type: 'select', label: 'Icon', options: iconOptions },
          { key: 'title', type: 'text', label: 'Title' },
          { key: 'text', type: 'textarea', label: 'Description' },
        ],
      },
    ],
  },
  {
    id: 'products', group: 'Website layout', title: 'What we trade', icon: Image, preview: 'products',
    intro: 'Photos of the produce you trade. Visitors can click a photo to ask for a quote for it.',
    fields: [
      show('products'),
      ...heading('products'),
      {
        path: 'products.items', type: 'list', label: 'Products', itemLabel: 'Product', titleKey: 'title',
        newItem: { title: 'New product', tag: 'Dry fruit', image: { src: '', alt: '' } },
        fields: [
          { key: 'title', type: 'text', label: 'Name' },
          { key: 'tag', type: 'text', label: 'Category', help: 'Products with the same category are grouped in the filter buttons, e.g. “Dry fruit” or “Fresh fruit”.' },
          { key: 'image', type: 'image', label: 'Photo' },
        ],
      },
    ],
  },
  {
    id: 'performance', group: 'Website layout', title: 'Trade numbers chart', icon: BarChart3, preview: 'performance',
    intro: 'How much you imported and exported each year. The totals and growth figure are worked out automatically.',
    fields: [
      show('performance'),
      ...heading('performance'),
      { path: 'performance.chartTitle', type: 'text', label: 'Chart title' },
      { path: 'performance.unit', type: 'text', label: 'Unit', help: 'For example “tonnes” or “containers”.' },
      { path: 'performance.importLabel', type: 'text', label: 'Name for imports' },
      { path: 'performance.exportLabel', type: 'text', label: 'Name for exports' },
      {
        path: 'performance.years', type: 'list', label: 'Years', itemLabel: 'Year', titleKey: 'year', compact: true,
        newItem: { year: new Date().getFullYear(), imported: 0, exported: 0 },
        fields: [
          { key: 'year', type: 'number', label: 'Year' },
          { key: 'imported', type: 'number', label: 'Imported' },
          { key: 'exported', type: 'number', label: 'Exported' },
        ],
      },
    ],
  },
  {
    id: 'reach', group: 'Website layout', title: 'Global reach map', icon: Globe2, preview: 'reach',
    intro: 'The countries you import from and export to. Each one is drawn on the world map with a route to your home country.',
    fields: [
      show('reach'),
      ...heading('reach'),
      { path: 'reach.hub', type: 'select', label: 'Home country (centre of the map)', options: countryOptions },
      { path: 'reach.importsTitle', type: 'text', label: 'Title for imports' },
      {
        path: 'reach.imports', type: 'list', label: 'Imports from', itemLabel: 'Country', titleKey: 'country',
        newItem: { country: 'United Arab Emirates', goods: '' },
        fields: [
          { key: 'country', type: 'select', label: 'Country', options: countryOptions },
          { key: 'goods', type: 'text', label: 'Products' },
        ],
      },
      { path: 'reach.exportsTitle', type: 'text', label: 'Title for exports' },
      {
        path: 'reach.exports', type: 'list', label: 'Exports to', itemLabel: 'Country', titleKey: 'country',
        newItem: { country: 'United Arab Emirates', goods: '' },
        fields: [
          { key: 'country', type: 'select', label: 'Country', options: countryOptions },
          { key: 'goods', type: 'text', label: 'Products' },
        ],
      },
    ],
  },
  {
    id: 'process', group: 'Website layout', title: 'How we work', icon: Workflow, preview: 'process',
    fields: [
      show('process'),
      ...heading('process', { text: false }),
      {
        path: 'process.steps', type: 'list', label: 'Steps', itemLabel: 'Step', titleKey: 'title',
        newItem: { title: 'New step', text: '' },
        fields: [
          { key: 'title', type: 'text', label: 'Title' },
          { key: 'text', type: 'textarea', label: 'Description' },
        ],
      },
    ],
  },
  {
    id: 'why', group: 'Website layout', title: 'Why choose us', icon: Star, preview: 'why',
    fields: [
      show('why'),
      ...heading('why', { text: false }),
      {
        path: 'why.items', type: 'list', label: 'Reasons', itemLabel: 'Reason', titleKey: 'title',
        newItem: { icon: 'badge', title: 'New reason', text: '' },
        fields: [
          { key: 'icon', type: 'select', label: 'Icon', options: iconOptions },
          { key: 'title', type: 'text', label: 'Title' },
          { key: 'text', type: 'textarea', label: 'Description' },
        ],
      },
    ],
  },
  {
    id: 'certifications', group: 'Website layout', title: 'Certifications', icon: ShieldCheck, preview: 'certifications',
    intro: 'Licences and registrations such as IEC, FSSAI or APEDA. The section only appears once you add at least one and switch it on.',
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
    id: 'testimonials', group: 'Website layout', title: 'Testimonials', icon: MessageSquareQuote, preview: 'testimonials',
    intro: 'Quotes from real customers. The section only appears once you add at least one and switch it on.',
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
    id: 'faq', group: 'Website layout', title: 'Questions & answers', icon: CircleHelp, preview: 'faq',
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
    id: 'partnership', group: 'Website layout', title: 'Partnership banner', icon: Handshake, preview: 'partnership',
    fields: [
      show('partnership'),
      ...heading('partnership'),
      { path: 'partnership.audiences', type: 'stringList', label: 'Who you want to partner with', addLabel: 'Add type of partner' },
      { path: 'partnership.button', type: 'text', label: 'Button text' },
      { path: 'partnership.image', type: 'image', label: 'Background photo' },
    ],
  },
  {
    id: 'contact', group: 'Website layout', title: 'Inquiry form', icon: Mail, preview: 'contact',
    intro: 'The contact section and the inquiry form. Inquiry types marked as partnership go to the partnership email; all others go to the inquiry email.',
    fields: [
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
    id: 'footer', group: 'Website layout', title: 'Footer & WhatsApp', icon: PanelBottom, preview: 'footer',
    fields: [
      { path: 'footer.about', type: 'textarea', label: 'Footer description' },
      { path: 'footer.copyright', type: 'text', label: 'Text after the copyright line' },
      { path: 'whatsappButton.enabled', type: 'toggle', label: 'Show the floating WhatsApp button' },
      { path: 'whatsappButton.message', type: 'text', label: 'Pre-filled WhatsApp message' },
    ],
  },
  {
    id: 'seo', group: 'Settings', title: 'Google & sharing', icon: Search, preview: null,
    intro: 'How the website appears in Google results and when the link is shared on WhatsApp, LinkedIn or Facebook.',
    fields: [
      { path: 'meta.title', type: 'text', label: 'Page title', help: 'Shown in the browser tab and as the Google result headline. About 50–60 characters.', counter: 60 },
      { path: 'meta.description', type: 'textarea', label: 'Description', help: 'Shown under the title in Google. About 150–160 characters.', counter: 160 },
      { path: 'meta.siteUrl', type: 'url', label: 'Website address', help: 'Your final domain, e.g. https://www.faizfayez.com. Used for link previews and the sitemap.' },
      { path: 'meta.shareImage', type: 'imageSrc', label: 'Share picture', help: 'Shown when the link is shared. Leave empty to use the top banner photo.' },
    ],
    seoPreview: true,
  },
  { id: 'backup', group: 'Settings', title: 'Backup', icon: Database, preview: null, special: 'backup', intro: 'Download a copy of all website content, or restore one.' },
]

