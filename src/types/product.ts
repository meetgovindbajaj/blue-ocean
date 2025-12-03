export interface ProductType {
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
