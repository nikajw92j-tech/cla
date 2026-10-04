import { z } from "zod";
import { PRIORITIES, REQUEST_CATEGORIES, TICKET_CATEGORIES, STYLES, WEBSITE_TYPES } from "./catalog";

const req = (max: number, min = 1) =>
  z.string().trim().min(min, min <= 1 ? "errors.required" : "errors.tooShort").max(max, "errors.tooLong");
const opt = (max: number) =>
  z.string().trim().max(max, "errors.tooLong").optional().transform((v) => (v ? v : undefined));

export const email = z.string().trim().toLowerCase().min(1, "errors.required").email("errors.invalidEmail").max(190, "errors.tooLong");
export const password = z
  .string()
  .min(8, "errors.passwordWeak")
  .max(128, "errors.tooLong")
  .refine((v) => /[A-Za-zა-ჰА-Яа-я]/.test(v) && /\d/.test(v), "errors.passwordWeak");

const url = z
  .string()
  .trim()
  .min(1, "errors.required")
  .max(300, "errors.tooLong")
  .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
  .refine((v) => {
    try {
      const u = new URL(v);
      return ["http:", "https:"].includes(u.protocol) && u.hostname.includes(".");
    } catch {
      return false;
    }
  }, "errors.invalidUrl");

export const loginSchema = z.object({ email, password: z.string().min(1, "errors.required").max(128), remember: z.string().optional() });

export const registerSchema = z
  .object({
    firstName: req(60),
    lastName: req(60),
    email,
    password,
    confirmPassword: z.string(),
    phone: opt(30).refine((v) => !v || /^[+\d][\d\s()-]{5,}$/.test(v), "errors.invalid"),
    company: opt(120),
    referral: opt(40),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "errors.passwordMismatch" });

export const resetSchema = z
  .object({ token: z.string().min(10), password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "errors.passwordMismatch" });

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "errors.required"), password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "errors.passwordMismatch" });

export const profileSchema = z.object({
  firstName: req(60),
  lastName: req(60),
  phone: opt(30),
  company: opt(120),
  country: opt(60),
  bio: opt(500),
});

export const orderBriefSchema = z.object({
  brandName: req(120),
  websiteType: z.enum(WEBSITE_TYPES, { message: "errors.required" }),
  industry: req(120),
  description: req(4000, 20),
  colors: opt(300),
  style: z.enum(STYLES).optional(),
  pagesCount: z.coerce.number().int().min(1, "errors.invalid").max(100, "errors.invalid"),
  functionality: opt(2000),
  examples: opt(2000),
});

export const modRequestSchema = z.object({
  websiteId: opt(40),
  websiteUrl: url,
  title: req(140, 3),
  description: req(5000, 10),
  category: z.enum(REQUEST_CATEGORIES, { message: "errors.required" }),
  priority: z.enum(PRIORITIES).default("NORMAL"),
  notes: opt(2000),
});

export const messageSchema = z.object({ body: req(5000) });
export const threadSchema = z.object({ subject: req(140, 3), body: req(5000), related: opt(60) });

export const ticketSchema = z.object({
  subject: req(140, 3),
  category: z.enum(TICKET_CATEGORIES, { message: "errors.required" }),
  body: req(5000, 5),
});

export const reviewSchema = z.object({
  websiteId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "errors.required").max(5),
  body: req(1500, 10),
  displayName: req(80),
  projectType: req(80),
});

export const leadSchema = z.object({
  name: req(80),
  email,
  websiteType: z.enum(WEBSITE_TYPES),
  features: z.array(z.string()).max(20),
  pages: z.coerce.number().int().min(1).max(100),
  timeline: z.enum(["asap", "month", "flexible"]),
});
