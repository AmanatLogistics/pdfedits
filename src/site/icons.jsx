import {
  Award, BadgeCheck, Building2, ClipboardCheck, Clock3, FileText, Globe2, Handshake, Leaf, PackageCheck,
  PackageSearch, Phone, PlaneLanding, PlaneTakeoff, Scale, Ship, ShieldCheck, Sprout, Star, Truck, Users, Warehouse,
} from 'lucide-react'

// Icons the admin panel can choose from, by key.
export const ICONS = {
  import: { label: 'Import (plane landing)', Icon: PlaneLanding },
  export: { label: 'Export (plane taking off)', Icon: PlaneTakeoff },
  ship: { label: 'Ship', Icon: Ship },
  truck: { label: 'Truck', Icon: Truck },
  search: { label: 'Sourcing / search', Icon: PackageSearch },
  quality: { label: 'Quality checklist', Icon: ClipboardCheck },
  package: { label: 'Packed goods', Icon: PackageCheck },
  warehouse: { label: 'Warehouse', Icon: Warehouse },
  document: { label: 'Documents', Icon: FileText },
  badge: { label: 'Quality badge', Icon: BadgeCheck },
  award: { label: 'Award', Icon: Award },
  scale: { label: 'Scale / fair pricing', Icon: Scale },
  clock: { label: 'Clock / on time', Icon: Clock3 },
  shield: { label: 'Shield / compliance', Icon: ShieldCheck },
  globe: { label: 'Globe', Icon: Globe2 },
  handshake: { label: 'Handshake', Icon: Handshake },
  leaf: { label: 'Leaf', Icon: Leaf },
  sprout: { label: 'Sprout / farm', Icon: Sprout },
  star: { label: 'Star', Icon: Star },
  users: { label: 'People', Icon: Users },
  building: { label: 'Building', Icon: Building2 },
  phone: { label: 'Phone', Icon: Phone },
}

export function Icon({ name, ...props }) {
  const entry = ICONS[name] ?? ICONS.badge
  return <entry.Icon aria-hidden="true" {...props} />
}
