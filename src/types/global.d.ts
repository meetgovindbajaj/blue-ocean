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
    parent: {
      name: string;
      slug: string;
      id: string;
    } | null;
    children: ICategory[];
    updatedAt: string;
    createdAt: string;
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
  }
}
