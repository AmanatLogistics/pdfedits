import {
  AirplaneTilt, Boat, Buildings, Certificate, ChartBar, Clock, GlobeHemisphereEast, Handshake, Leaf, Medal, Package,
  Plant, Scales, SealCheck, ShieldCheck, Star, Train, Truck, UsersThree, Warehouse,
} from './ph.jsx'

// Icons the admin panel can choose from, by key. Shown in Phosphor's
// two-tone ("duotone") style everywhere on the site.
export const ICONS = {
  air: { label: 'Air cargo (plane)', C: AirplaneTilt },
  road: { label: 'Road (truck)', C: Truck },
  sea: { label: 'Sea (ship)', C: Boat },
  rail: { label: 'Rail (train)', C: Train },
  truck: { label: 'Delivery truck', C: Truck },
  sprout: { label: 'Farm / origin', C: Plant },
  leaf: { label: 'Leaf / natural', C: Leaf },
  quality: { label: 'Quality seal', C: SealCheck },
  document: { label: 'Certificate / papers', C: Certificate },
  package: { label: 'Package', C: Package },
  warehouse: { label: 'Warehouse', C: Warehouse },
  scale: { label: 'Scales / fair weight', C: Scales },
  shield: { label: 'Shield / safety', C: ShieldCheck },
  globe: { label: 'Globe', C: GlobeHemisphereEast },
  handshake: { label: 'Handshake', C: Handshake },
  clock: { label: 'Clock / on time', C: Clock },
  medal: { label: 'Medal', C: Medal },
  star: { label: 'Star', C: Star },
  chart: { label: 'Chart', C: ChartBar },
  people: { label: 'People', C: UsersThree },
  building: { label: 'Building', C: Buildings },
}

export const TRANSPORT = {
  air: { label: 'Air', C: AirplaneTilt },
  road: { label: 'Road', C: Truck },
  sea: { label: 'Sea', C: Boat },
  rail: { label: 'Rail', C: Train },
}

export function Icon({ name, size = 24, weight = 'duotone', ...rest }) {
  const C = (ICONS[name] ?? ICONS.quality).C
  return <C size={size} weight={weight} aria-hidden="true" {...rest} />
}
