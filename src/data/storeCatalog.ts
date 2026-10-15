import { hardwareParts, type HardwarePart } from '@/data/hardwareCatalog';

export type StoreCategory =
  | 'cpu'
  | 'gpu'
  | 'motherboard'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooling'
  | 'fans'
  | 'monitor'
  | 'keyboard'
  | 'mouse';

export type StoreProduct = {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: StoreCategory;
  specs: string;
  price: number;
  demoStock: number;
  imageUrl?: string;
  imageAlt: string;
  builderPartId?: string;
};

const categoryLabels: Record<HardwarePart['category'], StoreCategory> = {
  cpu: 'cpu',
  gpu: 'gpu',
  motherboard: 'motherboard',
  ram: 'ram',
  storage: 'storage',
  psu: 'psu',
  case: 'case',
  cooler: 'cooling',
  fans: 'fans',
};

function extractBrand(name: string) {
  const prefixes = [
    'AMD',
    'Intel',
    'GeForce',
    'Radeon',
    'MSI',
    'Gigabyte',
    'ASUS',
    'ASRock',
    'Kingston',
    'Corsair',
    'G.Skill',
    'Crucial',
    'WD',
    'Samsung',
    'Seasonic',
    'Cooler Master',
    'DeepCool',
    'Montech',
    'NZXT',
    'Lian Li',
    'Thermalright',
    'Noctua',
    'ARCTIC',
    'Arctic',
    'be quiet!',
  ];
  return prefixes.find((brand) => name.startsWith(brand)) ?? 'Hardware';
}

function asStoreProduct(part: HardwarePart, index: number): StoreProduct {
  const brand = extractBrand(part.name);
  return {
    id: part.id,
    name: part.name,
    brand,
    model: part.name.replace(`${brand} `, ''),
    category: categoryLabels[part.category],
    specs: part.specs,
    price: part.price,
    demoStock: 3 + ((index * 7) % 12),
    imageAlt: `${part.category} reference illustration for ${part.name}; not a photograph of the exact SKU`,
    builderPartId: part.id,
  };
}

const peripherals: StoreProduct[] = [
  {
    id: 'monitor-acer-nitro-vg240y',
    name: 'Acer Nitro VG240Y M3',
    brand: 'Acer',
    model: 'Nitro VG240Y M3',
    category: 'monitor',
    specs: '23.8 in · Full HD · high-refresh gaming family',
    price: 10400,
    demoStock: 7,
    imageAlt: 'Monitor category reference illustration; not an exact product photo',
  },
  {
    id: 'monitor-asus-tuf-vg249q1a',
    name: 'ASUS TUF Gaming VG249Q1A',
    brand: 'ASUS',
    model: 'TUF Gaming VG249Q1A',
    category: 'monitor',
    specs: '23.8 in · Full HD · gaming display',
    price: 13900,
    demoStock: 4,
    imageAlt: 'Monitor category reference illustration; not an exact product photo',
  },
  {
    id: 'monitor-lg-ultragear-24gn60r',
    name: 'LG UltraGear 24GN60R-B',
    brand: 'LG',
    model: 'UltraGear 24GN60R-B',
    category: 'monitor',
    specs: '23.8 in · Full HD · IPS gaming display family',
    price: 12900,
    demoStock: 5,
    imageAlt: 'Monitor category reference illustration; not an exact product photo',
  },
  {
    id: 'monitor-samsung-odyssey-g5',
    name: 'Samsung Odyssey G5 27 in',
    brand: 'Samsung',
    model: 'Odyssey G5',
    category: 'monitor',
    specs: '27 in · QHD · gaming display family',
    price: 21900,
    demoStock: 3,
    imageAlt: 'Monitor category reference illustration; not an exact product photo',
  },
  {
    id: 'keyboard-logitech-g413-se',
    name: 'Logitech G413 SE',
    brand: 'Logitech',
    model: 'G413 SE',
    category: 'keyboard',
    specs: 'Full-size · wired · mechanical keyboard',
    price: 6990,
    demoStock: 8,
    imageAlt: 'Keyboard category reference illustration; not an exact product photo',
  },
  {
    id: 'keyboard-redragon-k552',
    name: 'Redragon K552',
    brand: 'Redragon',
    model: 'K552',
    category: 'keyboard',
    specs: 'Compact · wired · mechanical keyboard family',
    price: 2990,
    demoStock: 10,
    imageAlt: 'Keyboard category reference illustration; not an exact product photo',
  },
  {
    id: 'keyboard-keychron-c1-pro',
    name: 'Keychron C1 Pro',
    brand: 'Keychron',
    model: 'C1 Pro',
    category: 'keyboard',
    specs: 'Tenkeyless · wired · mechanical keyboard',
    price: 7990,
    demoStock: 4,
    imageAlt: 'Keyboard category reference illustration; not an exact product photo',
  },
  {
    id: 'keyboard-logitech-k120',
    name: 'Logitech K120',
    brand: 'Logitech',
    model: 'K120',
    category: 'keyboard',
    specs: 'Full-size · wired · membrane keyboard',
    price: 790,
    demoStock: 12,
    imageAlt: 'Keyboard category reference illustration; not an exact product photo',
  },
  {
    id: 'mouse-logitech-g102',
    name: 'Logitech G102 LIGHTSYNC',
    brand: 'Logitech',
    model: 'G102 LIGHTSYNC',
    category: 'mouse',
    specs: 'Wired · optical gaming mouse',
    price: 1490,
    demoStock: 11,
    imageAlt: 'Mouse category reference illustration; not an exact product photo',
  },
  {
    id: 'mouse-razer-deathadder-essential',
    name: 'Razer DeathAdder Essential',
    brand: 'Razer',
    model: 'DeathAdder Essential',
    category: 'mouse',
    specs: 'Ergonomic · wired gaming mouse family',
    price: 1290,
    demoStock: 6,
    imageAlt: 'Mouse category reference illustration; not an exact product photo',
  },
  {
    id: 'mouse-logitech-g502-hero',
    name: 'Logitech G502 HERO',
    brand: 'Logitech',
    model: 'G502 HERO',
    category: 'mouse',
    specs: 'Wired · configurable gaming mouse',
    price: 3990,
    demoStock: 5,
    imageAlt: 'Mouse category reference illustration; not an exact product photo',
  },
  {
    id: 'mouse-corsair-harpoon-rgb',
    name: 'Corsair HARPOON RGB',
    brand: 'Corsair',
    model: 'HARPOON RGB',
    category: 'mouse',
    specs: 'Compact · wired gaming mouse family',
    price: 1890,
    demoStock: 4,
    imageAlt: 'Mouse category reference illustration; not an exact product photo',
  },
];

export const storeProducts: StoreProduct[] = [
  ...hardwareParts.map(asStoreProduct),
  ...peripherals,
];

export const storeCategories: { id: StoreCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All hardware' },
  { id: 'cpu', label: 'CPUs' },
  { id: 'gpu', label: 'GPUs' },
  { id: 'motherboard', label: 'Motherboards' },
  { id: 'ram', label: 'RAM' },
  { id: 'storage', label: 'Storage' },
  { id: 'psu', label: 'Power supplies' },
  { id: 'case', label: 'PC cases' },
  { id: 'cooling', label: 'CPU coolers' },
  { id: 'fans', label: 'Case fans' },
  { id: 'monitor', label: 'Monitors' },
  { id: 'keyboard', label: 'Keyboards' },
  { id: 'mouse', label: 'Mice' },
];
