/* Seeds packages, settings, portfolio, reviews, an admin and a fully-populated demo customer.
   Self-contained (no app imports) so it runs outside Next.js. Safe to re-run: it upserts. */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const days = (n: number) => new Date(Date.now() + n * 86400000);

const PACKAGES = [
  {
    slug: "essential",
    priceGel: 200,
    deliveryDays: 10,
    sortOrder: 1,
    isPopular: false,
    content: {
      en: {
        name: "Essential Website",
        tagline: "Perfect for individuals and small businesses.",
        features: ["Professional responsive website", "Modern design", "Mobile optimization", "Basic animations", "Contact form", "Social media links", "Basic SEO setup", "Fast loading optimization", "Up to 5 main pages"],
      },
      ka: {
        name: "Essential ვებსაიტი",
        tagline: "იდეალურია ფიზიკური პირებისა და მცირე ბიზნესისთვის.",
        features: ["პროფესიონალური რესპონსიული ვებსაიტი", "თანამედროვე დიზაინი", "მობილურზე ოპტიმიზაცია", "საბაზისო ანიმაციები", "საკონტაქტო ფორმა", "სოციალური ქსელების ბმულები", "საბაზისო SEO", "სწრაფი ჩატვირთვის ოპტიმიზაცია", "5-მდე ძირითადი გვერდი"],
      },
      ru: {
        name: "Сайт Essential",
        tagline: "Идеально для частных лиц и малого бизнеса.",
        features: ["Профессиональный адаптивный сайт", "Современный дизайн", "Оптимизация под мобильные", "Базовые анимации", "Контактная форма", "Ссылки на соцсети", "Базовая настройка SEO", "Оптимизация скорости загрузки", "До 5 основных страниц"],
      },
    },
  },
  {
    slug: "premium",
    priceGel: 300,
    deliveryDays: 14,
    sortOrder: 2,
    isPopular: true,
    content: {
      en: {
        name: "Premium Website",
        tagline: "A custom, high-converting experience for growing brands.",
        features: ["Higher-quality custom design", "Advanced animations", "Better UI/UX", "More pages", "Advanced responsive design", "Interactive sections", "Premium visual effects", "Advanced contact forms", "Better SEO structure", "Performance optimization", "Custom components"],
      },
      ka: {
        name: "Premium ვებსაიტი",
        tagline: "ინდივიდუალური, მაღალკონვერსიული გამოცდილება მზარდი ბრენდებისთვის.",
        features: ["მაღალი ხარისხის ინდივიდუალური დიზაინი", "გაფართოებული ანიმაციები", "უკეთესი UI/UX", "მეტი გვერდი", "გაფართოებული რესპონსიული დიზაინი", "ინტერაქტიული სექციები", "პრემიუმ ვიზუალური ეფექტები", "გაფართოებული საკონტაქტო ფორმები", "უკეთესი SEO სტრუქტურა", "წარმადობის ოპტიმიზაცია", "ინდივიდუალური კომპონენტები"],
      },
      ru: {
        name: "Сайт Premium",
        tagline: "Индивидуальный сайт с высокой конверсией для растущих брендов.",
        features: ["Индивидуальный дизайн высокого качества", "Продвинутые анимации", "Улучшенный UI/UX", "Больше страниц", "Продвинутая адаптивность", "Интерактивные секции", "Премиальные визуальные эффекты", "Расширенные контактные формы", "Улучшенная SEO-структура", "Оптимизация производительности", "Индивидуальные компоненты"],
      },
    },
  },
  {
    slug: "ultimate",
    priceGel: 750,
    deliveryDays: 21,
    sortOrder: 3,
    isPopular: false,
    content: {
      en: {
        name: "Ultimate Website + Management",
        tagline: "A fully custom platform, managed and maintained for you.",
        features: ["Fully custom premium website", "Advanced UI/UX", "Premium animations", "Website management", "Content updates", "Technical support", "Performance monitoring", "Advanced SEO setup", "Custom functionality", "Website maintenance", "Priority support", "Advanced dashboard functionality", "Long-term website assistance"],
      },
      ka: {
        name: "Ultimate ვებსაიტი + მართვა",
        tagline: "სრულად ინდივიდუალური პლატფორმა, რომელსაც ჩვენ ვმართავთ და ვუვლით.",
        features: ["სრულად ინდივიდუალური პრემიუმ ვებსაიტი", "გაფართოებული UI/UX", "პრემიუმ ანიმაციები", "ვებსაიტის მართვა", "კონტენტის განახლება", "ტექნიკური მხარდაჭერა", "წარმადობის მონიტორინგი", "გაფართოებული SEO", "ინდივიდუალური ფუნქციონალი", "ვებსაიტის მოვლა", "პრიორიტეტული მხარდაჭერა", "გაფართოებული დაშბორდის ფუნქციები", "გრძელვადიანი დახმარება"],
      },
      ru: {
        name: "Сайт Ultimate + управление",
        tagline: "Полностью индивидуальная платформа, которую мы ведём и обслуживаем.",
        features: ["Полностью индивидуальный премиум-сайт", "Продвинутый UI/UX", "Премиальные анимации", "Управление сайтом", "Обновление контента", "Техническая поддержка", "Мониторинг производительности", "Продвинутая настройка SEO", "Индивидуальный функционал", "Обслуживание сайта", "Приоритетная поддержка", "Расширенный функционал панели", "Долгосрочное сопровождение"],
      },
    },
  },
];

const PORTFOLIO = [
  { title: "Kafe Roasters", category: "E-commerce", description: "Online coffee shop with subscriptions, delivery zones and a 3-step checkout.", technologies: "Next.js, Stripe, Tailwind CSS", accent: "#e3a55c", sortOrder: 1 },
  { title: "Vake Dental Studio", category: "Booking", description: "Clinic website with online appointments, doctor profiles and multilingual content.", technologies: "Next.js, PostgreSQL, i18n", accent: "#22d3ee", sortOrder: 2 },
  { title: "Mtatsminda Estates", category: "Real estate", description: "Property listings with map search, filters and a lead-capture CRM integration.", technologies: "React, Mapbox, Supabase", accent: "#6d5dfc", sortOrder: 3 },
  { title: "Nino Beridze Studio", category: "Portfolio", description: "Minimal portfolio for an interior designer with full-screen galleries.", technologies: "Next.js, Framer Motion", accent: "#ff7ab6", sortOrder: 4 },
  { title: "Kartli Wine Tours", category: "Tourism", description: "Tour booking platform with seasonal pricing and a guide dashboard.", technologies: "Next.js, Prisma, Tailwind CSS", accent: "#a855f7", sortOrder: 5 },
  { title: "FitLab Tbilisi", category: "Landing page", description: "High-converting gym landing page with class schedule and membership signup.", technologies: "Next.js, Vercel Analytics", accent: "#12b981", sortOrder: 6 },
];

const REVIEWS = [
  { displayName: "Giorgi M.", rating: 5, projectType: "E-commerce", body: "Our online store launched in two weeks and sales doubled the next month. The dashboard made it easy to follow every step." },
  { displayName: "Ana K.", rating: 5, projectType: "Booking website", body: "Professional, fast and genuinely invested in our success. Patients now book online instead of calling." },
  { displayName: "Levan T.", rating: 5, projectType: "Business website", body: "The design is far beyond what we expected. Pro membership pays for itself — small changes are done within a day." },
  { displayName: "Mariam G.", rating: 4, projectType: "Portfolio", body: "Beautiful animations and a very smooth process. I loved being able to upload references directly in the order form." },
  { displayName: "Dmitry S.", rating: 5, projectType: "Custom platform", body: "Clear pricing, clear communication. They manage our site completely so we can focus on the business." },
  { displayName: "Sophie L.", rating: 5, projectType: "Landing page", body: "Our conversion rate went from 1.8% to 4.6% after the redesign. Highly recommended." },
];

async function main() {
  console.log("Seeding…");

  for (const p of PACKAGES) {
    await db.package.upsert({
      where: { slug: p.slug },
      create: { ...p, content: JSON.stringify(p.content) },
      update: { content: JSON.stringify(p.content) },
    });
  }
  const pkgs = Object.fromEntries((await db.package.findMany()).map((p) => [p.slug, p]));

  if ((await db.portfolioProject.count()) === 0) await db.portfolioProject.createMany({ data: PORTFOLIO });

  // Admin
  const adminEmail = (process.env.ADMIN_EMAIL || "nikajw92j@gmail.com").toLowerCase();
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin12345!", 12),
      firstName: "Nexora",
      lastName: "Admin",
      role: "ADMIN",
      emailVerified: new Date(),
      locale: "en",
      profile: { create: {} },
      referralCode: { create: { code: "NEXORA" } },
    },
    update: {},
  });

  // Demo customer
  const demoEmail = "demo@nexora.dev";
  if (await db.user.findUnique({ where: { email: demoEmail } })) {
    console.log("Demo data already present — skipping demo customer.");
    return;
  }
  const demo = await db.user.create({
    data: {
      email: demoEmail,
      passwordHash: await bcrypt.hash("Demo12345!", 12),
      firstName: "Nika",
      lastName: "Javakhishvili",
      emailVerified: new Date(),
      locale: "ka",
      profile: { create: { phone: "+995 555 12 34 56", company: "Kafe Roasters", country: "Georgia" } },
      referralCode: { create: { code: "NIKA2026" } },
      membership: { create: { priceGel: 29, freeModsTotal: 5, freeModsUsed: 2, currentPeriodEnd: days(18), startedAt: days(-12) } },
    },
  });

  for (const r of REVIEWS) await db.review.create({ data: { ...r, userId: demo.id, approved: true, featured: r.rating === 5 } });

  // Completed website (order paid long ago)
  const order1 = await db.order.create({
    data: {
      number: "NX-K4F3E7",
      userId: demo.id,
      packageId: pkgs.premium.id,
      status: "COMPLETED",
      draftStep: 6,
      brandName: "Kafe Roasters",
      websiteType: "ECOMMERCE",
      industry: "Coffee & food",
      description: "Online store for specialty coffee with subscriptions and delivery across Tbilisi.",
      colors: "Warm brown, cream, amber",
      style: "ELEGANT",
      pagesCount: 8,
      features: JSON.stringify(["BLOG", "MULTILINGUAL"]),
      basePriceGel: 300,
      featuresPriceGel: 100,
      totalGel: 400,
      paymentMethod: "CARD",
      submittedAt: days(-60),
      createdAt: days(-61),
    },
  });
  const site1 = await db.website.create({
    data: { userId: demo.id, orderId: order1.id, name: "Kafe Roasters", url: "https://kafe.ge", status: "LIVE", stage: "COMPLETED", progress: 100, estimatedCompletion: days(-45), createdAt: days(-60) },
  });

  // In-progress website
  const order2 = await db.order.create({
    data: {
      number: "NX-V8D2M5",
      userId: demo.id,
      packageId: pkgs.ultimate.id,
      status: "IN_PROGRESS",
      draftStep: 6,
      brandName: "Vake Dental Studio",
      websiteType: "BOOKING",
      industry: "Healthcare",
      description: "Dental clinic website with online booking, doctor profiles and price list in three languages.",
      colors: "Clean white and teal",
      style: "MINIMAL",
      pagesCount: 10,
      features: JSON.stringify(["BOOKING"]),
      basePriceGel: 750,
      featuresPriceGel: 120,
      discountGel: 87,
      totalGel: 783,
      paymentMethod: "CARD",
      submittedAt: days(-9),
      createdAt: days(-10),
    },
  });
  const site2 = await db.website.create({
    data: { userId: demo.id, orderId: order2.id, name: "Vake Dental Studio", status: "IN_DEVELOPMENT", stage: "DEVELOPMENT", progress: 65, managed: true, estimatedCompletion: days(8), previewUrl: "https://example.com", createdAt: days(-9) },
  });

  // Payments + invoices
  const mkPayment = async (purpose: string, amountGel: number, items: { label: string; amountGel: number }[], at: Date, extra: { orderId?: string; requestId?: string }, discountGel = 0) => {
    const p = await db.payment.create({ data: { userId: demo.id, purpose, amountGel, method: "CARD", status: "SUCCEEDED", paidAt: at, createdAt: at, providerRef: "seed", ...extra } });
    await db.invoice.create({
      data: { number: `INV-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, userId: demo.id, paymentId: p.id, items: JSON.stringify(items), subtotalGel: items.reduce((s, i) => s + i.amountGel, 0), discountGel, totalGel: amountGel, status: "PAID", issuedAt: at },
    });
  };
  await mkPayment("ORDER", 400, [{ label: "package:premium", amountGel: 300 }, { label: "feature:BLOG", amountGel: 40 }, { label: "feature:MULTILINGUAL", amountGel: 60 }], days(-60), { orderId: order1.id });
  await mkPayment("PRO", 29, [{ label: "pro:monthly", amountGel: 29 }], days(-12), {});
  await mkPayment("ORDER", 783, [{ label: "package:ultimate", amountGel: 750 }, { label: "feature:BOOKING", amountGel: 120 }], days(-9), { orderId: order2.id }, 87);

  // Modification requests in different states
  const reqs = [
    { number: "RQ-T7XQ2A", title: "Update coffee prices on the shop page", category: "TEXT", status: "COMPLETED", wasPro: false, priceGel: 10, finalGel: 10, at: -40 },
    { number: "RQ-H3PL9B", title: "Add a holiday banner to the homepage", category: "SECTION", status: "COMPLETED", wasPro: true, priceGel: 10, finalGel: 0, discountGel: 10, usedFreeCredit: true, at: -10 },
    { number: "RQ-M5RW8C", title: "Replace hero images with new photos", category: "IMAGES", status: "IN_PROGRESS", wasPro: true, priceGel: 10, finalGel: 0, discountGel: 10, usedFreeCredit: true, at: -3 },
    { number: "RQ-Z2NK4D", title: "Fix menu overlap on small phones", category: "RESPONSIVE", status: "WAITING_CUSTOMER", wasPro: true, priceGel: 10, finalGel: 6, discountGel: 4, at: -2 },
  ];
  const statusPath: Record<string, string[]> = {
    COMPLETED: ["SUBMITTED", "REVIEWING", "APPROVED", "IN_PROGRESS", "WAITING_CUSTOMER", "COMPLETED"],
    IN_PROGRESS: ["SUBMITTED", "REVIEWING", "APPROVED", "IN_PROGRESS"],
    WAITING_CUSTOMER: ["SUBMITTED", "REVIEWING", "IN_PROGRESS", "WAITING_CUSTOMER"],
  };
  for (const r of reqs) {
    const { at, ...data } = r;
    await db.modificationRequest.create({
      data: {
        ...data,
        userId: demo.id,
        websiteId: site1.id,
        websiteUrl: "https://kafe.ge",
        description: `${r.title}. Details and screenshots attached — please keep the current style.`,
        priority: r.category === "RESPONSIVE" ? "HIGH" : "NORMAL",
        createdAt: days(at),
        events: { create: statusPath[r.status].map((s, i) => ({ status: s, createdAt: new Date(days(at).getTime() + i * 3600_000 * 5) })) },
      },
    });
  }

  // Activity
  const acts: [string, Record<string, string | number>, number, string?][] = [
    ["orderPaid", { number: order2.number }, -9, site2.id],
    ["stageChanged", { stage: "@status.stage.DESIGN" }, -7, site2.id],
    ["previewUploaded", {}, -5, site2.id],
    ["stageChanged", { stage: "@status.stage.DEVELOPMENT" }, -2, site2.id],
    ["requestCreated", { number: "RQ-M5RW8C" }, -3, site1.id],
    ["proActivated", {}, -12],
  ];
  for (const [kind, params, at, websiteId] of acts) await db.activity.create({ data: { userId: demo.id, kind, params: JSON.stringify(params), websiteId, createdAt: days(at) } });

  // Messages
  const thread = await db.thread.create({
    data: { userId: demo.id, subject: "Homepage design feedback", websiteId: site2.id, unreadByUser: 1, lastMessageAt: days(-1), createdAt: days(-6) },
  });
  const msgs: [string, boolean, number][] = [
    ["Hi! I looked at the homepage preview — love it. Could the booking button be more visible?", false, -6],
    ["Thanks Nika! Absolutely — we'll make it sticky on mobile and use the teal accent.", true, -5.8],
    ["Perfect. Also, can we add a short video of the clinic?", false, -2],
    ["Yes, send us the file here and we'll include it in the hero section. Development is at 65% — on track for next week.", true, -1],
  ];
  for (const [body, staff, at] of msgs) await db.message.create({ data: { threadId: thread.id, senderId: staff ? admin.id : demo.id, body, fromStaff: staff, createdAt: days(at) } });

  // Support ticket
  await db.supportTicket.create({
    data: {
      number: "TK-4QW8RZ",
      userId: demo.id,
      subject: "Invoice in company name",
      category: "BILLING",
      status: "ANSWERED",
      replies: {
        create: [
          { authorId: demo.id, body: "Could you re-issue my last invoice with our company name?", createdAt: days(-4) },
          { authorId: admin.id, body: "Done — the company name now appears on all invoices from your profile.", fromStaff: true, createdAt: days(-3) },
        ],
      },
    },
  });

  // Notifications
  const notifs: [string, Record<string, string | number>, string, number, boolean][] = [
    ["newMessage", {}, `/dashboard/messages/${thread.id}`, -1, false],
    ["requestInProgress", {}, "/dashboard/requests", -2, false],
    ["stageChanged", { name: "Vake Dental Studio", stage: "@status.stage.DEVELOPMENT" }, `/dashboard/websites/${site2.id}`, -2, false],
    ["designReady", {}, `/dashboard/websites/${site2.id}`, -5, true],
    ["proActivated", {}, "/dashboard/pro", -12, true],
  ];
  for (const [kind, params, link, at, read] of notifs) await db.notification.create({ data: { userId: demo.id, kind, params: JSON.stringify(params), link, createdAt: days(at), readAt: read ? days(at) : null } });

  await db.discountCode.upsert({ where: { code: "WELCOME10" }, create: { code: "WELCOME10", description: "10% off your first website", type: "PERCENT", value: 10, appliesTo: "ORDER" }, update: {} });
  await db.discountCode.upsert({ where: { code: "PRO50" }, create: { code: "PRO50", description: "50 GEL off for Pro members", type: "FIXED", value: 50, appliesTo: "ORDER", proOnly: true }, update: {} });

  console.log("✔ Seed complete");
  console.log(`  Admin:    ${adminEmail} / ${process.env.ADMIN_PASSWORD || "Admin12345!"}`);
  console.log("  Customer: demo@nexora.dev / Demo12345!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
