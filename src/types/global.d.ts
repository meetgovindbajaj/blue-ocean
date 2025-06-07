export {};

declare global {
  interface ICategory {
    name: string;
    slug: string;
    description: string;
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
    } | null;
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
