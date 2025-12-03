import { model, Schema, Document, models } from "mongoose";

interface ISocialLink {
  platform: string;
  url: string;
  icon?: string;
}

interface IContactInfo {
  email: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  mapUrl?: string;
}

interface IBusinessHours {
  day: string;
  open: string;
  close: string;
  isClosed?: boolean;
}

interface ISiteSettings extends Document {
  // General Info
  siteName: string;
  tagline?: string;
  logo?: {
    url: string;
    alt?: string;
  };
  favicon?: string;

  // About Section
  about: {
    title?: string;
    description?: string;
    mission?: string;
    vision?: string;
    history?: string;
    team?: {
      name: string;
      role: string;
      image?: string;
      bio?: string;
    }[];
  };

  // Contact Information
  contact: IContactInfo;

  // Social Media Links
  socialLinks: ISocialLink[];

  // Business Hours
  businessHours: IBusinessHours[];

  // Footer Content
  footer: {
    copyright?: string;
    description?: string;
    quickLinks?: {
      label: string;
      url: string;
    }[];
  };

  // SEO Defaults
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  };

  // Policies
  policies: {
    privacyPolicy?: string;
    termsOfService?: string;
    returnPolicy?: string;
    shippingPolicy?: string;
  };

  // WhatsApp/Chat Support
  support: {
    whatsappNumber?: string;
    whatsappMessage?: string;
    enableLiveChat?: boolean;
  };

  // FAQ
  faq: {
    question: string;
    answer: string;
    order?: number;
    isActive?: boolean;
  }[];

  // Currency & Locale
  locale: {
    currency: string;
    currencySymbol: string;
    locale: string;
  };

  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: {
      type: String,
      required: true,
      default: "Furniture Store",
    },
    tagline: String,
    logo: {
      url: String,
      alt: String,
    },
    favicon: String,

    about: {
      title: String,
      description: String,
      mission: String,
      vision: String,
      history: String,
      team: [
        {
          name: String,
          role: String,
          image: String,
          bio: String,
        },
      ],
    },

    contact: {
      email: { type: String, required: true, default: "contact@example.com" },
      phone: String,
      alternatePhone: String,
      address: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      mapUrl: String,
    },

    socialLinks: [
      {
        platform: { type: String, required: true },
        url: { type: String, required: true },
        icon: String,
      },
    ],

    businessHours: [
      {
        day: { type: String, required: true },
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
    ],

    footer: {
      copyright: String,
      description: String,
      quickLinks: [
        {
          label: String,
          url: String,
        },
      ],
    },

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String,
    },

    policies: {
      privacyPolicy: String,
      termsOfService: String,
      returnPolicy: String,
      shippingPolicy: String,
    },

    support: {
      whatsappNumber: String,
      whatsappMessage: { type: String, default: "Hello! I have a question." },
      enableLiveChat: { type: Boolean, default: false },
    },

    faq: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
      },
    ],

    locale: {
      currency: { type: String, default: "INR" },
      currencySymbol: { type: String, default: "₹" },
      locale: { type: String, default: "en-IN" },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SiteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      siteName: "Furniture Store",
      contact: { email: "contact@example.com" },
    });
  }
  return settings;
};

const SiteSettings =
  models.SiteSettings ||
  model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
