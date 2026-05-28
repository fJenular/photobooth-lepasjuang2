export interface Frame {
  id: string;
  name: string;
  category: 'ALL' | 'RETRO' | 'CUTE' | 'FOOTBALL' | 'AESTHETIC';
  layoutType: 'photostrip' | 'grid' | 'polaroid' | 'square';
  bgColor: string; // Background color or gradient
  textColor: string;
  borderColor: string;
  patternClass?: string; // Checkered or stripe backgrounds
  accentText?: string;
  accentBadge?: string;
}

export interface Sticker {
  id: string;
  emoji: string;
  label: string;
}

export interface FilterOption {
  id: string;
  name: string;
  class: string;
}

export const FILTERS: FilterOption[] = [
  { id: 'normal', name: 'Normal', class: '' },
  { id: 'vintage', name: 'Retro Sepia', class: 'filter-vintage' },
  { id: 'grayscale', name: 'Black & White', class: 'filter-grayscale' },
  { id: 'warm', name: 'Warm Sun', class: 'filter-warm' },
  { id: 'cool', name: 'Cyber Cool', class: 'filter-cool' },
  { id: 'contrast', name: 'Pop Art', class: 'filter-contrast' }
];

export const FRAMES: Frame[] = [
  // BAZMA SPECIAL THEMED FRAME (Square)
  {
    id: 'lepas-juang-bazma',
    name: 'Lepas Juang #2 (SMK TI Bazma)',
    category: 'AESTHETIC',
    layoutType: 'square',
    bgColor: '#ffffff',
    textColor: '#1d4ed8', // Royal Blue
    borderColor: '#1d4ed8',
    accentText: '2 JUNE 2025',
    accentBadge: 'Special'
  },
  // PHOTOSTRIP LAYOUTS (4 Photos Vertically)
  {
    id: 'strip-classic-black',
    name: 'Classic Black Strip',
    category: 'RETRO',
    layoutType: 'photostrip',
    bgColor: '#121212',
    textColor: '#ffffff',
    borderColor: '#000000',
    accentText: 'TAKE YOUR TIME • 2026',
    accentBadge: 'Retro'
  },
  {
    id: 'strip-pastel-pink',
    name: 'Kawaii Pink Checkered',
    category: 'CUTE',
    layoutType: 'photostrip',
    bgColor: '#fce7f3',
    textColor: '#ec4899',
    borderColor: '#f472b6',
    patternClass: 'bg-[radial-gradient(#fbcfe8_1px,transparent_1px)] [background-size:16px_16px]',
    accentText: '♥ SWEET MOMENT ♥',
    accentBadge: 'Kawaii'
  },
  {
    id: 'strip-retro-arcade',
    name: 'Neon Arcade',
    category: 'RETRO',
    layoutType: 'photostrip',
    bgColor: '#1e1b4b',
    textColor: '#818cf8',
    borderColor: '#4f46e5',
    accentText: 'INSERT COIN TO PLAY',
    accentBadge: 'Arcade'
  },
  {
    id: 'strip-aesthetic-sand',
    name: 'Desert Sand',
    category: 'AESTHETIC',
    layoutType: 'photostrip',
    bgColor: '#faf7f2',
    textColor: '#78350f',
    borderColor: '#d97706',
    accentText: 'w a r m   v i b e s',
    accentBadge: 'Cozy'
  },

  // GRID LAYOUTS (6 Photos, 3x2)
  {
    id: 'grid-united',
    name: 'Glory Man United',
    category: 'FOOTBALL',
    layoutType: 'grid',
    bgColor: '#991b1b', // Deep Red
    textColor: '#facc15', // Yellow
    borderColor: '#7f1d1d',
    accentText: 'GLORY GLORY MAN UNITED!',
    accentBadge: 'Legendary'
  },
  {
    id: 'grid-narutopix',
    name: 'NarutoPix Grid',
    category: 'RETRO',
    layoutType: 'grid',
    bgColor: '#ea580c', // Orange
    textColor: '#fef08a', // Light Yellow
    borderColor: '#c2410c',
    patternClass: 'bg-[linear-gradient(45deg,#ea580c_25%,#c2410c_25%,#c2410c_50%,#ea580c_50%,#ea580c_75%,#c2410c_75%,#c2410c_100%)] [background-size:40px_40px]',
    accentText: 'DATTEBAYO! 🍥',
    accentBadge: 'Rare'
  },
  {
    id: 'grid-pixel-village',
    name: 'Retro Pixel Village',
    category: 'RETRO',
    layoutType: 'grid',
    bgColor: '#15803d', // Green
    textColor: '#f0fdf4',
    borderColor: '#166534',
    accentText: 'LEVEL 1 START 🕹️',
    accentBadge: 'Pixel'
  },
  {
    id: 'grid-milk-shake',
    name: 'Milk & Shake Checkers',
    category: 'CUTE',
    layoutType: 'grid',
    bgColor: '#fef08a',
    textColor: '#854d0e',
    borderColor: '#eab308',
    patternClass: 'bg-[radial-gradient(#fde047_2px,transparent_2px)] [background-size:20px_20px]',
    accentText: 'TAKE IT EASY 🥛✨',
    accentBadge: 'Cute'
  },

  // POLAROID LAYOUTS (1 Large Photo)
  {
    id: 'polaroid-classic',
    name: 'Vintage Polaroid',
    category: 'RETRO',
    layoutType: 'polaroid',
    bgColor: '#fffffb',
    textColor: '#4b5563',
    borderColor: '#e5e7eb',
    accentText: 'Captured Moment • 2026',
    accentBadge: 'Original'
  },
  {
    id: 'polaroid-cyberpunk',
    name: 'Neo Shinjuku',
    category: 'AESTHETIC',
    layoutType: 'polaroid',
    bgColor: '#0f172a',
    textColor: '#38bdf8',
    borderColor: '#0284c7',
    patternClass: 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px]',
    accentText: 'S H I N J U K U // 2 0 2 6',
    accentBadge: 'Epic'
  },
  {
    id: 'polaroid-sparkle',
    name: 'Sparkle Daydream',
    category: 'CUTE',
    layoutType: 'polaroid',
    bgColor: '#fae8ff',
    textColor: '#c084fc',
    borderColor: '#e879f9',
    accentText: '✨ Dream Big & Smile ✨',
    accentBadge: 'Kawaii'
  }
];

export const STICKERS: Sticker[] = [
  { id: 's1', emoji: '✨', label: 'Sparkles' },
  { id: 's2', emoji: '❤️', label: 'Heart' },
  { id: 's3', emoji: '🌟', label: 'Star' },
  { id: 's4', emoji: '😎', label: 'Cool Glasses' },
  { id: 's5', emoji: '🎨', label: 'Palette' },
  { id: 's6', emoji: '📸', label: 'Camera' },
  { id: 's7', emoji: '🐱', label: 'Cat Face' },
  { id: 's8', emoji: '🐼', label: 'Panda' },
  { id: 's9', emoji: '🌸', label: 'Cherry Blossom' },
  { id: 's10', emoji: '🍀', label: 'Clover' },
  { id: 's11', emoji: '🍥', label: 'Naruto Swirl' },
  { id: 's12', emoji: '👑', label: 'Crown' },
  { id: 's13', emoji: '🎈', label: 'Balloon' },
  { id: 's14', emoji: '🧸', label: 'Teddy Bear' },
  { id: 's15', emoji: '🔥', label: 'Fire' }
];

export const BACKDROP_COLORS = [
  { name: 'Pure White', value: '#ffffff' },
  { name: 'Charcoal Black', value: '#1a1a1a' },
  { name: 'Cyber Blue', value: '#1e3a8a' },
  { name: 'Neon Green', value: '#14532d' },
  { name: 'Lilac Candy', value: '#581c87' },
  { name: 'Peach Cream', value: '#7c2d12' }
];
