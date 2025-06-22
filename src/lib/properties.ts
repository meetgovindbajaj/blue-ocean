const properties: IProperties = {
  breakpoints: {
    mobile: {
      small: 320,
      medium: 375,
      large: 425,
      default: 425,
    },
    tablet: {
      default: 768,
    },
    laptop: {
      small: 1024,
      medium: 1440,
      large: 2560,
      default: 1024,
    },
  },
  MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_IMAGE_WIDTH: 2000,
  MAX_IMAGE_HEIGHT: 2000,
};

export default properties;
