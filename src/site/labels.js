// Small texts used across the website (buttons, form labels, headings of
// small lists). Each can be changed in the admin panel under "Buttons &
// small texts"; anything left empty uses the wording below.

export const LABEL_GROUPS = [
  {
    title: 'Menu & buttons',
    items: {
      home: ['Home', 'Menu link to the home page'],
      askPrice: ['Ask for a price', 'On each product card'],
      allProducts: ['All', 'First product filter button'],
      seeRecord: ['See the full record', 'Link on the total-shipped card'],
      openPage: ['Open', 'Link on the home page cards'],
      productsWord: ['products', 'On the home page Products card, after the number'],
      since: ['Since', 'On the home page About card, before the year'],
    },
  },
  {
    title: 'Track record & shipments',
    items: {
      sampleNote: ['These are example figures. Replace them with your own trade records in the admin panel.', 'Shown while the example records are in place'],
      exported: ['exported', 'After an amount, e.g. “2,520 Tons exported”'],
      imported: ['imported', 'After an amount, e.g. “90 Tons imported”'],
      shipped: ['shipped', 'After an amount on product cards'],
      soFar: ['so far', 'After the current year in the chart'],
      soFarNote: ['figures so far this year', 'Note under the chart'],
      averageOrder: ['Average order', 'Fact under the transport list'],
      biggestYear: ['Biggest year', 'Fact under the transport list'],
      biggestMonth: ['Biggest month', 'Fact under the transport list, while the chart shows months'],
      topProduct: ['Most shipped', 'Fact under the transport list: the product shipped most'],
      productsTraded: ['Products traded', 'Fact under the transport list'],
      lastUpdated: ['Last updated with shipments from', 'Line under the figures'],
      exportTag: ['Export', 'Tag on a shipment card'],
      importTag: ['Import', 'Tag on a shipment card'],
      freight: ['freight', 'After the transport, e.g. “Road freight”'],
    },
  },
  {
    title: 'Partners',
    items: {
      partnerWith: ['Logistics partner', 'Before the partner’s name in the top banner and the footer'],
      partnerTotal: ['Shipped together', 'First figure on a partner, the total of all its figures'],
      partnerSince: ['Partners since', 'Before the year on a partner'],
      partnerVisit: ['Visit website', 'Link to a partner’s website'],
      partnerExampleShort: ['Example figures, to be replaced with the real amounts.', 'Small note under the partner figures on the home page while they are marked as examples'],
      partnerSampleNote: ['These are example figures. Replace them with your real shipments in the admin panel under Partners.', 'Shown while the partner figures are marked as examples'],
    },
  },
  {
    title: 'Shipping',
    items: {
      topDestinations: ['Top destinations', 'Shown when you ship to several countries'],
      howTravelled: ['How it travelled', 'Shown when you ship to one country'],
      exportsFrom: ['Exports from', 'Map legend, followed by your home city'],
      importsTo: ['Imports to', 'Map legend, followed by your home city'],
      air: ['Air', 'Transport name'],
      road: ['Road', 'Transport name'],
      sea: ['Sea', 'Transport name'],
      rail: ['Rail', 'Transport name'],
    },
  },
  {
    title: 'Contact & inquiry form',
    items: {
      ordersEmail: ['Orders & inquiries', 'Above the inquiry email'],
      partnersEmail: ['Business partnerships', 'Above the partnership email'],
      phone: ['Phone', 'Above the phone number'],
      whatsapp: ['WhatsApp', 'Above the WhatsApp link'],
      whatsappText: ['Chat with our team', 'WhatsApp link text'],
      office: ['Office', 'Above the address'],
      hours: ['Business hours', 'Above the opening hours'],
      inquiryType: ['Inquiry type', 'Form field'],
      fullName: ['Full name', 'Form field'],
      company: ['Company', 'Form field'],
      email: ['Email', 'Form field'],
      phoneField: ['Phone / WhatsApp', 'Form field'],
      product: ['Product', 'Form field'],
      quantity: ['Quantity', 'Form field'],
      quantityHint: ['e.g. 20 Tons', 'Example text inside the quantity field'],
      country: ['Country', 'Form field'],
      message: ['Message', 'Form field'],
      messageHint: ['Grade, packing, delivery port and timeline.', 'Example text inside the message field'],
      goesTo: ['Goes to', 'Next to the send button, before the email address'],
      sentTitle: ['Inquiry sent', 'Title after sending'],
      sendAnother: ['Send another inquiry', 'Button after sending'],
      mailtoNote: ['Your email app should open with the message ready. If it doesn’t, write to', 'When the form opens the visitor’s email app'],
      askQuestion: ['Ask a question', 'Button next to the questions & answers'],
    },
  },
  {
    title: 'Footer',
    items: {
      footerCompany: ['Company', 'Heading of the page links'],
      footerContact: ['Get in touch', 'Heading of the contact details'],
      photos: ['Photos', 'Before the photo credits'],
    },
  },
]

export const LABEL_DEFAULTS = Object.fromEntries(LABEL_GROUPS.flatMap((g) => Object.entries(g.items).map(([k, [text]]) => [k, text])))

// The text for `key`: the admin panel's wording, or the default above.
export const label = (content, key) => String(content?.labels?.[key] || '').trim() || LABEL_DEFAULTS[key] || ''

// "Road freight", "Air freight", … for a transport key.
export const freightName = (content, key) => `${label(content, key) || key} ${label(content, 'freight')}`
