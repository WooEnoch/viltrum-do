export const ASSET = '/assets/nikkibee/';

export const products = [
  {
    id: 'chain-sandals',
    image: 'hero-left.png',
    name: 'Chain Sandals',
    price: 32000,
    color: 'Gold',
    category: 'Shoes',
    description: 'A polished block-heel sandal finished with a delicate gold chain detail.',
    sizes: ['37', '38', '39', '40', '41'],
    isNew: true,
  },
  {
    id: 'embroidered-coord',
    image: 'product-two.png',
    name: 'Embroidered Co-ord',
    price: 48500,
    color: 'Navy',
    category: 'Sets',
    description: 'A relaxed two-piece set with bold embroidered motifs and an easy drape.',
    sizes: ['S', 'M', 'L', 'XL'],
    isNew: true,
  },
  {
    id: 'crystal-slingback',
    image: 'product-three.png',
    name: 'Crystal Slingback',
    price: 38000,
    color: 'White',
    category: 'Shoes',
    description: 'A graceful slingback with a sculpted heel and crystal-trimmed mesh.',
    sizes: ['37', '38', '39', '40', '41'],
    isNew: true,
  },
  {
    id: 'casa-shirt',
    image: 'product-four.png',
    name: 'Casa Shirt',
    price: 27500,
    color: 'Sky',
    category: 'Tops',
    description: 'An expressive resort shirt with a fluid fit and statement back artwork.',
    sizes: ['S', 'M', 'L', 'XL'],
    isNew: true,
  },
  {
    id: 'sunrise-wrap-dress',
    image: 'sunrise-one.png',
    name: 'Sunrise Wrap Dress',
    price: 42000,
    color: 'Dawn',
    category: 'Dresses',
    description: 'A light wrap silhouette in soft sunrise florals, made for warm days.',
    sizes: ['S', 'M', 'L'],
  },
  {
    id: 'meadow-ruffle-dress',
    image: 'sunrise-two.png',
    name: 'Meadow Ruffle Dress',
    price: 46000,
    color: 'Green',
    category: 'Dresses',
    description: 'A playful tiered dress with generous movement and vivid green blooms.',
    sizes: ['S', 'M', 'L'],
  },
  {
    id: 'daybreak-set',
    image: 'sunrise-three.png',
    name: 'Daybreak Set',
    price: 35000,
    color: 'Blue',
    category: 'Sets',
    description: 'A breezy matching set with scalloped detailing and an effortless cut.',
    sizes: ['S', 'M', 'L', 'XL'],
  },
];

export const occasions = [
  { image: 'occasion-everyday.png', name: 'Everyday', description: 'Ease, worn well', category: 'Tops' },
  { image: 'occasion-work.png', name: 'Work', description: 'Quiet authority', category: 'Sets' },
  { image: 'occasion-casual.png', name: 'Casual', description: 'Off-duty softness', category: 'Dresses' },
  { image: 'occasion-evening.png', name: 'Evening', description: 'After work', category: 'Shoes' },
];

export const socialImages = ['one', 'two', 'three', 'four', 'five', 'six'].map((number) => `social-${number}.png`);

export const formatPrice = (price) => `N${price.toLocaleString('en-NG')}`;
