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
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_WIDTH: 4000,
  MAX_IMAGE_HEIGHT: 4000,
};

export default properties;
