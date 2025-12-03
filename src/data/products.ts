import { Archive, Bed, Laptop, Sofa } from "lucide-react";

// Product type matching MongoDB schema
interface ProductType {
  id: string;
  name: string;
  slug: string;
  description: string;
  prices: {
    wholesale: number;
    retail: number;
    discount: number;
  };
  size: {
    length: number;
    width: number;
    height: number;
    fixedSize: boolean;
    unit: "cm" | "mm" | "in" | "ft";
  };
  category: string;
  images: {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
    downloadUrl: string;
    size: number;
    width: number;
    height: number;
  }[];
  breadcrumbs: { id: string; name: string; slug: string }[];
  isActive: boolean;
  relevanceScore?: number;
}

export var products: ProductType[] = [
  {
    id: "prod-001",
    name: "Modern Accent Chair",
    slug: "modern-accent-chair",
    description: "Stylish modern accent chair with premium upholstery",
    prices: {
      wholesale: 399,
      retail: 499,
      discount: 29,
    },
    size: {
      length: 80,
      width: 75,
      height: 90,
      fixedSize: true,
      unit: "cm",
    },
    category: "living-room",
    images: [
      {
        id: "img-001",
        name: "modern-accent-chair.jpg",
        url: "https://images.unsplash.com/photo-1750306957357-bf6e1f8e7da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1750306957357-bf6e1f8e7da8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
        isThumbnail: true,
        downloadUrl:
          "https://images.unsplash.com/photo-1750306957357-bf6e1f8e7da8",
        size: 245000,
        width: 800,
        height: 600,
      },
    ],
    breadcrumbs: [
      { id: "living-room", name: "Living Room", slug: "living-room" },
    ],
    isActive: true,
  },
  {
    id: "prod-002",
    name: "Luxury Velvet Sofa",
    slug: "luxury-velvet-sofa",
    description: "Premium velvet sofa with deep seating comfort",
    prices: {
      wholesale: 999,
      retail: 1299,
      discount: 0,
    },
    size: {
      length: 220,
      width: 95,
      height: 85,
      fixedSize: false,
      unit: "cm",
    },
    category: "living-room",
    images: [
      {
        id: "img-002",
        name: "luxury-velvet-sofa.jpg",
        url: "https://images.unsplash.com/photo-1680774445948-ec3614f7579b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1680774445948-ec3614f7579b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
        isThumbnail: true,
        downloadUrl:
          "https://images.unsplash.com/photo-1680774445948-ec3614f7579b",
        size: 312000,
        width: 800,
        height: 600,
      },
    ],
    breadcrumbs: [
      { id: "living-room", name: "Living Room", slug: "living-room" },
    ],
    isActive: true,
  },
  {
    id: "prod-003",
    name: "Oak Coffee Table",
    slug: "oak-coffee-table",
    description: "Solid oak coffee table with natural finish",
    prices: {
      wholesale: 279,
      retail: 349,
      discount: 22,
    },
    size: {
      length: 120,
      width: 60,
      height: 45,
      fixedSize: true,
      unit: "cm",
    },
    category: "living-room",
    images: [
      {
        id: "img-003",
        name: "oak-coffee-table.jpg",
        url: "https://images.unsplash.com/photo-1658367754793-1200cee7b3d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1658367754793-1200cee7b3d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
        isThumbnail: true,
        downloadUrl:
          "https://images.unsplash.com/photo-1658367754793-1200cee7b3d6",
        size: 198000,
        width: 800,
        height: 600,
      },
    ],
    breadcrumbs: [
      { id: "living-room", name: "Living Room", slug: "living-room" },
    ],
    isActive: true,
  },
  {
    id: "prod-004",
    name: "Minimalist Bookshelf",
    slug: "minimalist-bookshelf",
    description: "Modern minimalist bookshelf with open shelving",
    prices: {
      wholesale: 219,
      retail: 279,
      discount: 0,
    },
    size: {
      length: 100,
      width: 30,
      height: 180,
      fixedSize: true,
      unit: "cm",
    },
    category: "storage",
    images: [
      {
        id: "img-004",
        name: "minimalist-bookshelf.jpg",
        url: "https://images.unsplash.com/photo-1661964366355-afcc34ec7690?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1661964366355-afcc34ec7690?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
        isThumbnail: true,
        downloadUrl:
          "https://images.unsplash.com/photo-1661964366355-afcc34ec7690",
        size: 267000,
        width: 800,
        height: 600,
      },
    ],
    breadcrumbs: [{ id: "storage", name: "Storage", slug: "storage" }],
    isActive: true,
  },
  {
    id: "prod-005",
    name: "Designer Armchair",
    slug: "designer-armchair",
    description: "Designer armchair with ergonomic support",
    prices: {
      wholesale: 479,
      retail: 599,
      discount: 25,
    },
    size: {
      length: 85,
      width: 80,
      height: 95,
      fixedSize: true,
      unit: "cm",
    },
    category: "living-room",
    images: [
      {
        id: "img-005",
        name: "designer-armchair.jpg",
        url: "https://images.unsplash.com/photo-1759722667456-71e7bfd118b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1759722667456-71e7bfd118b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
        isThumbnail: true,
        downloadUrl:
          "https://images.unsplash.com/photo-1759722667456-71e7bfd118b2",
        size: 289000,
        width: 800,
        height: 600,
      },
    ],
    breadcrumbs: [
      { id: "living-room", name: "Living Room", slug: "living-room" },
    ],
    isActive: true,
  },
  {
    id: "prod-006",
    name: "Office Desk Set",
    slug: "office-desk-set",
    description: "Complete office desk set with storage solutions",
    prices: {
      wholesale: 719,
      retail: 899,
      discount: 0,
    },
    size: {
      length: 150,
      width: 70,
      height: 75,
      fixedSize: false,
      unit: "cm",
    },
    category: "office",
    images: [
      {
        id: "img-006",
        name: "office-desk-set.jpg",
        url: "https://images.unsplash.com/photo-1701664368345-e3bec90acd53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1701664368345-e3bec90acd53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
        isThumbnail: true,
        downloadUrl:
          "https://images.unsplash.com/photo-1701664368345-e3bec90acd53",
        size: 334000,
        width: 800,
        height: 600,
      },
    ],
    breadcrumbs: [{ id: "office", name: "Office", slug: "office" }],
    isActive: true,
  },
  {
    id: "prod-007",
    name: "Dining Table with Chairs",
    slug: "dining-table-with-chairs",
    description: "Complete dining set with 6 chairs",
    prices: {
      wholesale: 1199,
      retail: 1499,
      discount: 21,
    },
    size: {
      length: 180,
      width: 90,
      height: 75,
      fixedSize: true,
      unit: "cm",
    },
    category: "dining",
    images: [
      {
        id: "img-007",
        name: "dining-table-chairs.jpg",
        url: "https://images.unsplash.com/photo-1547062200-f195b1c77e30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1547062200-f195b1c77e30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
        isThumbnail: true,
        downloadUrl:
          "https://images.unsplash.com/photo-1547062200-f195b1c77e30",
        size: 401000,
        width: 800,
        height: 600,
      },
    ],
    breadcrumbs: [{ id: "dining", name: "Dining", slug: "dining" }],
    isActive: true,
  },
  {
    id: "prod-008",
    name: "King Size Bed Frame",
    slug: "king-size-bed-frame",
    description: "Luxury king size bed frame with upholstered headboard",
    prices: {
      wholesale: 639,
      retail: 799,
      discount: 0,
    },
    size: {
      length: 210,
      width: 180,
      height: 120,
      fixedSize: true,
      unit: "cm",
    },
    category: "bedroom",
    images: [
      {
        id: "img-008",
        name: "king-size-bed-frame.jpg",
        url: "https://images.unsplash.com/photo-1680503146454-04ac81a63550?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1680503146454-04ac81a63550?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
        isThumbnail: true,
        downloadUrl:
          "https://images.unsplash.com/photo-1680503146454-04ac81a63550",
        size: 356000,
        width: 800,
        height: 600,
      },
    ],
    breadcrumbs: [{ id: "bedroom", name: "Bedroom", slug: "bedroom" }],
    isActive: true,
  },
];

// Category type matching MongoDB schema
export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  parent?: string;
  description?: string;
  image: {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
    downloadUrl: string;
    size: number;
    width: number;
    height: number;
  };
  isActive: boolean;
  children: string[];
  icon?: any;
}

export var categories: CategoryType[] = [
  {
    id: "living-room",
    name: "Living Room",
    slug: "living-room",
    description:
      "Sofas, coffee tables, and entertainment units for your living space",
    image: {
      id: "cat-img-001",
      name: "living-room.jpg",
      url: "https://images.unsplash.com/photo-1709346739762-e8ecacc96e0a?w=800",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1709346739762-e8ecacc96e0a?w=400",
      isThumbnail: true,
      downloadUrl:
        "https://images.unsplash.com/photo-1709346739762-e8ecacc96e0a",
      size: 425000,
      width: 800,
      height: 600,
    },
    isActive: true,
    children: [],
    icon: Sofa,
  },
  {
    id: "bedroom",
    name: "Bedroom",
    slug: "bedroom",
    description: "Beds, dressers, and nightstands for restful spaces",
    image: {
      id: "cat-img-002",
      name: "bedroom.jpg",
      url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400",
      isThumbnail: true,
      downloadUrl:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
      size: 389000,
      width: 800,
      height: 600,
    },
    isActive: true,
    children: [],
    icon: Bed,
  },
  {
    id: "office",
    name: "Office",
    slug: "office",
    description: "Desks, chairs, and storage for productive workspaces",
    image: {
      id: "cat-img-003",
      name: "office.jpg",
      url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400",
      isThumbnail: true,
      downloadUrl:
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
      size: 367000,
      width: 800,
      height: 600,
    },
    isActive: true,
    children: [],
    icon: Laptop,
  },
  {
    id: "storage",
    name: "Storage",
    slug: "storage",
    description: "Shelving, cabinets, and organizational solutions",
    image: {
      id: "cat-img-004",
      name: "storage.jpg",
      url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400",
      isThumbnail: true,
      downloadUrl:
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2",
      size: 341000,
      width: 800,
      height: 600,
    },
    isActive: true,
    children: [],
    icon: Archive,
  },
  {
    id: "dining",
    name: "Dining",
    slug: "dining",
    description: "Dining tables, chairs, and dining room furniture",
    image: {
      id: "cat-img-005",
      name: "dining.jpg",
      url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400",
      isThumbnail: true,
      downloadUrl:
        "https://images.unsplash.com/photo-1617806118233-18e1de247200",
      size: 378000,
      width: 800,
      height: 600,
    },
    isActive: true,
    children: [],
    icon: Sofa,
  },
  {
    id: "outdoor",
    name: "Outdoor",
    slug: "outdoor",
    description: "Patio furniture and outdoor living essentials",
    image: {
      id: "cat-img-006",
      name: "outdoor.jpg",
      url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400",
      isThumbnail: true,
      downloadUrl:
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
      size: 412000,
      width: 800,
      height: 600,
    },
    isActive: true,
    children: [],
    icon: Sofa,
  },
];
