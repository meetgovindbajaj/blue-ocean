import { Document as MongodbDoc, Types } from "mongoose";

export {};

declare global {
  interface IGoogleImage {
    id: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    isThumbnail: boolean;
    downloadUrl: string;
    size: number;
    width: number;
    height: number;
  }
  interface IGoogleImageResponse {
    id: string;
    name: string;
    size: string;
    mimeType: string;
    thumbnailLink: string;
    webContentLink: string;
    webViewLink: string;
    imageMediaMetadata: {
      width: number;
      height: number;
      rotation: number;
    };
  }
  interface ICategory {
    name: string;
    slug: string;
    description: string;
    image: IGoogleImage | null;
    id: string;
    isActive: boolean;
    parent: {
      name: string;
      slug: string;
      id: string;
    } | null;
    children: ICategory[];
    updatedAt: string;
    createdAt: string;
  }

  interface IProduct {
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
    category: ICategory;
    images: IGoogleImage[];
    breadcrumbs: { id: string; name: string; slug: string }[];
    isActive: true | false;
    updatedAt: string;
    createdAt: string;
  }

  interface IViewLog extends MongodbDoc {
    type: "product" | "category";
    refId: Types.ObjectId; // ID of the product or category
    viewedAt: Date;
    ip: string;
    count: number;
  }

  interface IGetData {
    categories?: ICategory[];
    products?: IProduct[];
    status: number;
    error?: string;
    message: string;
  }

  interface IProperties {
    breakpoints: {
      mobile: {
        small: number;
        medium: number;
        large: number;
        default: number;
      };
      tablet: {
        default: number;
      };
      laptop: {
        small: number;
        medium: number;
        large: number;
        default: number;
      };
    };
    MAX_IMAGE_SIZE: number;
    MAX_IMAGE_WIDTH: number;
    MAX_IMAGE_HEIGHT: number;
  }
}
