// Central catalog of enumerations. Labels live in the i18n dictionaries
// (keyed by these codes), never here.

export const ROLES = ["CUSTOMER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PACKAGE_SLUGS = ["essential", "premium", "ultimate"] as const;
export type PackageSlug = (typeof PACKAGE_SLUGS)[number];

export const ORDER_STATUSES = ["DRAFT", "PENDING_PAYMENT", "PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const REQUEST_STATUSES = [
  "SUBMITTED",
  "REVIEWING",
  "APPROVED",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "COMPLETED",
  "CANCELLED",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_CATEGORIES = [
  "TEXT",
  "SECTION",
  "IMAGES",
  "BUTTONS",
  "PAGES",
  "COLORS",
  "FORMS",
  "ANIMATIONS",
  "RESPONSIVE",
  "FUNCTIONALITY",
  "OTHER",
] as const;
export type RequestCategory = (typeof REQUEST_CATEGORIES)[number];

export const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STAGES = [
  { code: "STARTED", progress: 20 },
  { code: "DESIGN", progress: 40 },
  { code: "DEVELOPMENT", progress: 65 },
  { code: "TESTING", progress: 85 },
  { code: "REVIEW", progress: 95 },
  { code: "COMPLETED", progress: 100 },
] as const;
export type Stage = (typeof STAGES)[number]["code"];

export const WEBSITE_STATUSES = ["IN_DEVELOPMENT", "LIVE", "MAINTENANCE", "PAUSED"] as const;

export const TICKET_CATEGORIES = ["GENERAL", "WEBSITE_PROBLEM", "BILLING", "MODIFICATION", "TECHNICAL"] as const;
export const TICKET_STATUSES = ["OPEN", "ANSWERED", "AWAITING_STAFF", "RESOLVED", "CLOSED"] as const;

export const PAYMENT_STATUSES = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
export const PAYMENT_METHODS = ["CARD", "BANK_TRANSFER"] as const;

export const WEBSITE_TYPES = ["BUSINESS", "PORTFOLIO", "LANDING", "ECOMMERCE", "BOOKING", "CUSTOM"] as const;
export type WebsiteType = (typeof WEBSITE_TYPES)[number];

export const STYLES = ["MINIMAL", "BOLD", "ELEGANT", "PLAYFUL", "CORPORATE", "FUTURISTIC"] as const;

/** Features selectable in the order wizard & calculator. Prices (GEL) are defaults; admin can override in settings. */
export const FEATURES = [
  "CONTACT_FORM",
  "BLOG",
  "PORTFOLIO",
  "GALLERY",
  "BOOKING",
  "STORE",
  "ACCOUNTS",
  "ADMIN",
  "ANIMATIONS",
  "MULTILINGUAL",
  "CUSTOM_FORMS",
  "SOCIAL",
  "ANALYTICS",
] as const;
export type Feature = (typeof FEATURES)[number];

export const DEFAULT_FEATURE_PRICES: Record<Feature, number> = {
  CONTACT_FORM: 0,
  BLOG: 40,
  PORTFOLIO: 30,
  GALLERY: 20,
  BOOKING: 120,
  STORE: 250,
  ACCOUNTS: 150,
  ADMIN: 180,
  ANIMATIONS: 30,
  MULTILINGUAL: 60,
  CUSTOM_FORMS: 40,
  SOCIAL: 0,
  ANALYTICS: 15,
};

/** Features already included (free) in each package. */
export const PACKAGE_INCLUDED: Record<PackageSlug, Feature[]> = {
  essential: ["CONTACT_FORM", "SOCIAL"],
  premium: ["CONTACT_FORM", "SOCIAL", "ANIMATIONS", "CUSTOM_FORMS", "GALLERY", "ANALYTICS"],
  ultimate: [
    "CONTACT_FORM",
    "SOCIAL",
    "ANIMATIONS",
    "CUSTOM_FORMS",
    "GALLERY",
    "ANALYTICS",
    "BLOG",
    "PORTFOLIO",
    "MULTILINGUAL",
    "ADMIN",
  ],
};

/** Starting estimate used by the public calculator per website type (GEL). */
export const TYPE_BASE: Record<WebsiteType, number> = {
  LANDING: 200,
  PORTFOLIO: 200,
  BUSINESS: 300,
  BOOKING: 300,
  ECOMMERCE: 750,
  CUSTOM: 750,
};

export const CURRENCIES = ["GEL", "USD", "RUB"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const CURRENCY_SYMBOL: Record<Currency, string> = { GEL: "₾", USD: "$", RUB: "₽" };

export const LOCALES = ["ka", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ka";

export const isOneOf = <T extends readonly string[]>(list: T, v: unknown): v is T[number] =>
  typeof v === "string" && (list as readonly string[]).includes(v);
