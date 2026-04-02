import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const resolveWorkspaceRoot = () => {
  const cwd = process.cwd();
  const directRoot = path.join(cwd, "apps", "web");

  if (existsSync(directRoot)) {
    return cwd;
  }

  return path.resolve(cwd, "..", "..");
};

const WORKSPACE_ROOT = resolveWorkspaceRoot();

const loadLocalEnv = () => {
  const envCandidates = [path.join(process.cwd(), ".env"), path.join(WORKSPACE_ROOT, ".env")];

  const envPath = envCandidates.find((candidate) => existsSync(candidate));

  if (!envPath) {
    return;
  }

  const raw = readFileSync(envPath, "utf8");

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadLocalEnv();

const prisma = new PrismaClient();
const app = Fastify({ logger: true });
const DEMO_WORKSPACE_SLUG = "demo-studio";

const createBusinessSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(2),
  category: z.string().min(2),
  city: z.string().min(2),
  country: z.string().min(2),
  primaryGoal: z.enum(["RESERVATION", "ORDER", "PROFILE_TRAFFIC", "AWARENESS"]),
});

const updateBusinessSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  priceSegment: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(2),
  country: z.string().min(2),
  phone: z.string().optional(),
  websiteUrl: z.string().optional(),
  reservationUrl: z.string().optional(),
  whatsappUrl: z.string().optional(),
  primaryGoal: z.enum(["RESERVATION", "ORDER", "PROFILE_TRAFFIC", "AWARENESS"]),
  operatingMode: z.enum(["SELF_SERVE", "MANAGED", "HYBRID"]),
  dashboardAccessEnabled: z.boolean(),
  telegramControlEnabled: z.boolean(),
  publishMode: z.enum(["MANUAL", "SMART", "AUTO"]),
  preferredLanguage: z.string().min(2),
  toneSummary: z.string().optional(),
  ctaPreferencesJson: z.string().optional(),
  forbiddenPhrasesJson: z.string().optional(),
  targetAudienceJson: z.string().optional(),
  peakHoursJson: z.string().optional(),
  seasonalNotesJson: z.string().optional(),
});

const telegramCommandSchema = z.object({
  command: z.string().min(2),
});

const telegramCommandApplySchema = telegramCommandSchema.extend({
  source: z.enum(["dashboard", "telegram"]).default("dashboard"),
});

const createAssetSchema = z.object({
  businessId: z.string().uuid(),
  fileName: z.string().min(2),
  storageKey: z.string().min(4),
  mimeType: z.string().min(3),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  source: z.string().optional(),
  qualityScore: z.coerce.number().min(0).max(100).optional(),
  tags: z.array(z.string().min(1)).default([]),
});

const updateAssetSchema = z.object({
  fileName: z.string().min(2),
  storageKey: z.string().min(4),
  mimeType: z.string().min(3),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  source: z.string().optional(),
  qualityScore: z.coerce.number().min(0).max(100).optional(),
  isFeatured: z.boolean(),
  tags: z.array(z.string().min(1)).default([]),
});

const contentStatusEnum = z.enum([
  "DRAFT",
  "GENERATED",
  "NEEDS_REVIEW",
  "WAITING_APPROVAL",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "FAILED",
  "ARCHIVED",
]);

const createContentItemSchema = z.object({
  businessId: z.string().uuid(),
  title: z.string().min(2),
  type: z.enum(["POST", "REEL", "STORY"]),
  status: contentStatusEnum,
  pillarName: z.string().optional(),
  targetAction: z.string().optional(),
  plannedFor: z.string().optional(),
  approvalRequired: z.boolean().default(true),
  needsClientApproval: z.boolean().default(true),
});

const updateContentItemSchema = createContentItemSchema.omit({ businessId: true });

const approvalActionSchema = z.object({
  action: z.enum(["APPROVE", "REVISE", "REJECT"]),
  note: z.string().optional(),
});

const telegramLinkSchema = z.object({
  chatId: z.string().min(2),
  chatTitle: z.string().optional(),
});

const updateVisualWorldSchema = z.object({
  conceptSummary: z.string().optional(),
  sectorLens: z.string().optional(),
  ambienceNotes: z.string().optional(),
  lightingStyle: z.string().optional(),
  materialPalette: z.string().optional(),
  heroAnglesJson: z.string().optional(),
  keepElementsJson: z.string().optional(),
  bannedElementsJson: z.string().optional(),
});

const createVisualReferenceSchema = z.object({
  assetId: z.string().uuid(),
  role: z.string().min(2),
  zone: z.string().optional(),
  notes: z.string().optional(),
  isAnchor: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

const updateVisualReferenceSchema = createVisualReferenceSchema.partial().extend({
  role: z.string().min(2).optional(),
});

const createSceneRecipeSchema = z.object({
  title: z.string().min(2),
  sceneType: z.string().min(2),
  objective: z.string().optional(),
  promptFrame: z.string().optional(),
  subjectNotes: z.string().optional(),
  compositionNotes: z.string().optional(),
  variationNotes: z.string().optional(),
  active: z.boolean().default(true),
});

const updateSceneRecipeSchema = createSceneRecipeSchema.partial();

const createGenerationBriefSchema = z.object({
  title: z.string().min(2),
  sceneRecipeId: z.string().uuid().optional(),
  generationMode: z.string().min(2),
  objective: z.string().optional(),
  outputType: z.string().optional(),
  aspectRatio: z.string().optional(),
  status: z.string().optional(),
  variationCount: z.coerce.number().int().min(1).max(12).default(4),
  promptDirection: z.string().optional(),
  subjectDirection: z.string().optional(),
  remixInstruction: z.string().optional(),
  selectedReferenceIdsJson: z.string().optional(),
  selectedAssetIdsJson: z.string().optional(),
  keepElementsJson: z.string().optional(),
});

const updateGenerationBriefSchema = createGenerationBriefSchema.partial();

const updateAutopilotPolicySchema = z.object({
  status: z.string().optional(),
  planningMode: z.string().optional(),
  approvalMode: z.string().optional(),
  publishEnabled: z.boolean().optional(),
  allowAutoVisualGeneration: z.boolean().optional(),
  allowAutoPublishing: z.boolean().optional(),
  weeklyCadenceJson: z.string().optional(),
  preferredTimeWindowsJson: z.string().optional(),
  agendaSensitivityJson: z.string().optional(),
  seasonalPriorityJson: z.string().optional(),
  contentMixJson: z.string().optional(),
  generationGuardrailsJson: z.string().optional(),
});

const materializeAutopilotSchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(14),
});

const runQueuedJobsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(6),
});

const selectContentOutputSchema = z.object({
  contentItemAssetId: z.string().uuid(),
});

const materializePublishJobsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

const runDuePublishJobsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(5),
});

const updateInstagramIntegrationSchema = z.object({
  accountName: z.string().min(2),
  externalAccountId: z.string().optional(),
  status: z.enum(["CONNECTED", "DISCONNECTED", "PENDING"]),
  connectorMode: z.enum(["SIMULATED", "META_API_READY"]),
  username: z.string().optional(),
  pageId: z.string().optional(),
  igBusinessId: z.string().optional(),
  notes: z.string().optional(),
});

const metaOAuthCallbackQuerySchema = z.object({
  business_id: z.string().uuid().optional(),
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
  error_reason: z.string().optional(),
  error_description: z.string().optional(),
});

const includeBusinessProfile = {
  settings: true,
  brandProfiles: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
  contentPillars: {
    where: { active: true },
    orderBy: { priority: "asc" as const },
  },
};

const includeAssetLibrary = {
  tags: {
    orderBy: { createdAt: "asc" as const },
  },
};

const includeVisualWorldProfile = {
  visualWorldProfile: {
    include: {
      references: {
        orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
        include: {
          asset: {
            include: includeAssetLibrary,
          },
        },
      },
      sceneRecipes: {
        orderBy: [{ active: "desc" as const }, { createdAt: "asc" as const }],
      },
    },
  },
};

const includeContentLibrary = {
  assets: {
    orderBy: [{ isSelected: "desc" as const }, { sortOrder: "asc" as const }],
    include: {
      asset: true,
    },
  },
  approvals: {
    orderBy: { requestedAt: "desc" as const },
    include: {
      actions: {
        orderBy: { createdAt: "desc" as const },
      },
    },
  },
};

const demoAssets = [
  {
    storageKey:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
    mimeType: "image/jpeg",
    fileName: "signature-burger.jpg",
    mediaType: "IMAGE",
    source: "initial_shoot",
    qualityScore: 93,
    isFeatured: true,
    tags: ["product", "hero-shot", "signature"],
  },
  {
    storageKey:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    mimeType: "image/jpeg",
    fileName: "restaurant-ambience.jpg",
    mediaType: "IMAGE",
    source: "initial_shoot",
    qualityScore: 88,
    isFeatured: false,
    tags: ["space", "atmosphere"],
  },
  {
    storageKey:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    mimeType: "video/mp4",
    fileName: "kitchen-motion.mp4",
    mediaType: "VIDEO",
    source: "initial_shoot",
    qualityScore: 84,
    isFeatured: false,
    tags: ["process", "reel-broll"],
  },
];

const demoContentItems = [
  {
    title: "Yeni tatli reels",
    type: "REEL",
    status: "WAITING_APPROVAL",
    pillarName: "Signature tabaklar",
    targetAction: "RESERVATION",
    plannedFor: new Date("2026-04-01T18:30:00.000Z"),
    approvalRequired: true,
    needsClientApproval: true,
  },
  {
    title: "Oglen menusu carousel",
    type: "POST",
    status: "SCHEDULED",
    pillarName: "Mekan atmosferi",
    targetAction: "PROFILE_TRAFFIC",
    plannedFor: new Date("2026-04-02T12:00:00.000Z"),
    approvalRequired: false,
    needsClientApproval: false,
  },
  {
    title: "Aksam rezervasyon push",
    type: "STORY",
    status: "GENERATED",
    pillarName: "Rezervasyon CTA",
    targetAction: "RESERVATION",
    plannedFor: new Date("2026-04-05T19:00:00.000Z"),
    approvalRequired: true,
    needsClientApproval: true,
  },
];

const demoVisualReferences = [
  {
    fileName: "restaurant-ambience.jpg",
    role: "interior_anchor",
    zone: "main_floor",
    notes: "Masa yerlesimi, sicak duvar tonlari ve aydinlatma hissi korunmali.",
    isAnchor: true,
    sortOrder: 1,
  },
  {
    fileName: "signature-burger.jpg",
    role: "hero_product_context",
    zone: "tabletop",
    notes: "Masa ustu cekimlerde karanlik ahsap yuzey ve premium servis hissi korunmali.",
    isAnchor: false,
    sortOrder: 2,
  },
];

const demoSceneRecipes = [
  {
    title: "Aksam servisinde masa basi an",
    sceneType: "NARRATIVE_LIFESTYLE",
    objective: "RESERVATION",
    promptFrame:
      "Mekanin ana alaninda, marka dokusunu bozmadan gercek bir aksam bulusmasi hissi ver.",
    subjectNotes:
      "Iki kisi rahat ve samimi sekilde yemek paylasiyor. Ortam premium ama fazla poz verilmis hissettirmiyor.",
    compositionNotes:
      "Arka planda ayni sandalye, masa tonu ve duvar renkleri korunmali. Cekim hafif capraz acidan olmali.",
    variationNotes:
      "Bir varyasyonda servis oncesi sakin masa, diger varyasyonda yemek ortasi sosyal an kullan.",
    active: true,
  },
  {
    title: "Signature urun mekan icinde yakin plan",
    sceneType: "PRODUCT_IN_CONTEXT",
    objective: "PROFILE_TRAFFIC",
    promptFrame:
      "Urunu on plana al ama mekanin ayni doku, renk ve servis kimligini arka planda hissettir.",
    subjectNotes:
      "Ana urun net, arka plan yumusak bokeh ile mekan oldugunu hissettirmeli.",
    compositionNotes:
      "45 derece masa acisi, masa yuzeyi ve servis aksesuarlarinin stili korunmali.",
    variationNotes:
      "Yakın plan, ustten bakis ve hafif el kadraji gibi varyasyonlar uret.",
    active: true,
  },
];

const demoGenerationBriefs = [
  {
    title: "Aksam servisinde sosyal masa varyasyonlari",
    recipeTitle: "Aksam servisinde masa basi an",
    generationMode: "NARRATIVE_LIFESTYLE",
    objective: "RESERVATION",
    outputType: "IMAGE_SET",
    aspectRatio: "4:5",
    status: "READY_FOR_GENERATION",
    variationCount: 4,
    promptDirection:
      "Mekana ait ayni sandalye, masa ve duvar tonlari korunurken farkli acilardan sosyal bir aksam bulusmasi hissi ver.",
    subjectDirection:
      "Gercek insan davranisi, yumusak gulumseme, yemege odakli samimi bir atmosfer.",
    remixInstruction:
      "Anchor frame referanslarini bozma; sadece insan yerlesimi, kadraj ve servis anini degistir.",
    keepElementsJson: JSON.stringify([
      "koyu ahsap masa",
      "sicak duvar tonu",
      "aksam servis isigi",
    ]),
  },
  {
    title: "Signature urun icin premium tabletop seti",
    recipeTitle: "Signature urun mekan icinde yakin plan",
    generationMode: "PRODUCT_IN_CONTEXT",
    objective: "PROFILE_TRAFFIC",
    outputType: "IMAGE_SET",
    aspectRatio: "4:5",
    status: "DRAFT",
    variationCount: 3,
    promptDirection:
      "Ana urunu one cikar ama mekani sadece blur arka plan degil, taniyabilecegimiz bir marka dunyasi gibi hissettir.",
    subjectDirection:
      "Tabak, servis aksesuarı ve masanin premium ritmi dogal kalsin.",
    remixInstruction:
      "Urun boyutu ve plating dili korunarak aci ve lens etkisi cesitlendirilsin.",
    keepElementsJson: JSON.stringify([
      "masa dokusu",
      "servis aksesuarlarinin stili",
      "restoranin sicak premium rengi",
    ]),
  },
];

const buildAutopilotSchedule = (input: {
  businessName: string;
  primaryGoal: string;
  peakHoursJson?: string | null;
  sceneRecipes: Array<{
    id: string;
    title: string;
    sceneType: string;
    objective: string | null;
  }>;
}) => {
  const peaks = (() => {
    try {
      const parsed = input.peakHoursJson ? JSON.parse(input.peakHoursJson) : [];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(String) : ["12:30", "19:30"];
    } catch {
      return ["12:30", "19:30"];
    }
  })();

  const modes = [
    {
      contentType: "POST",
      theme: "Gun ortasi urun ve mekan dengesi",
      objective: "PROFILE_TRAFFIC",
    },
    {
      contentType: "REEL",
      theme: "Aksam ritmi ve sosyal an",
      objective: input.primaryGoal,
    },
  ];

  const today = new Date();
  const results: Array<{
    title: string;
    theme: string;
    contentType: string;
    generationMode: string;
    objective: string;
    scheduledFor: Date;
    sceneRecipeId: string | null;
    reasoning: string;
  }> = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const baseDate = new Date(today);
    baseDate.setDate(today.getDate() + dayOffset);

    modes.forEach((mode, index) => {
      const peak = peaks[Math.min(index, peaks.length - 1)] || "18:30";
      const [hour, minute] = peak.split(":").map((value) => Number(value));
      const scheduledFor = new Date(baseDate);
      scheduledFor.setHours(Number.isFinite(hour) ? hour : 18, Number.isFinite(minute) ? minute : 30, 0, 0);

      const recipe = input.sceneRecipes[(dayOffset + index) % Math.max(input.sceneRecipes.length, 1)] || null;

      results.push({
        title: `${input.businessName} · ${mode.theme}`,
        theme: mode.theme,
        contentType: mode.contentType,
        generationMode: recipe?.sceneType || (mode.contentType === "REEL" ? "NARRATIVE_LIFESTYLE" : "PRODUCT_IN_CONTEXT"),
        objective: recipe?.objective || mode.objective,
        scheduledFor,
        sceneRecipeId: recipe?.id || null,
        reasoning:
          mode.contentType === "REEL"
            ? "Aksam peak saatine yakin sosyal ve atmosfer odakli sahne otomatik secildi."
            : "Gun ortasi profil trafigi icin urun + mekan baglamini dengeleyen feed slotu secildi.",
      });
    });
  }

  return results;
};

const ensureDemoAssets = async (businessId: string) => {
  const assetCount = await prisma.asset.count({
    where: { businessId },
  });

  if (assetCount > 0) {
    return;
  }

  for (const asset of demoAssets) {
    await prisma.asset.create({
      data: {
        businessId,
        storageKey: asset.storageKey,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        mediaType: asset.mediaType,
        source: asset.source,
        qualityScore: asset.qualityScore,
        isFeatured: asset.isFeatured,
        tags: {
          create: asset.tags.map((tag) => ({ tag })),
        },
      },
    });
  }
};

const ensureDemoContentItems = async (businessId: string) => {
  const contentCount = await prisma.contentItem.count({
    where: { businessId },
  });

  if (contentCount > 0) {
    return;
  }

  for (const item of demoContentItems) {
    const created = await prisma.contentItem.create({
      data: {
        businessId,
        title: item.title,
        type: item.type,
        status: item.status,
        pillarName: item.pillarName,
        targetAction: item.targetAction,
        plannedFor: item.plannedFor,
        approvalRequired: item.approvalRequired,
        needsClientApproval: item.needsClientApproval,
      },
    });

    if (item.status === "WAITING_APPROVAL") {
      await prisma.approvalRequest.create({
        data: {
          contentItemId: created.id,
          channel: "telegram",
          status: "SENT",
        },
      });
    }
  }
};

const ensureDemoApprovals = async (businessId: string) => {
  const waitingItems = await prisma.contentItem.findMany({
    where: {
      businessId,
      status: "WAITING_APPROVAL",
    },
    include: {
      approvals: {
        where: {
          status: { in: ["PENDING", "SENT"] },
        },
      },
    },
  });

  for (const item of waitingItems) {
    if (item.approvals.length === 0) {
      await prisma.approvalRequest.create({
        data: {
          contentItemId: item.id,
          channel: "telegram_simulated",
          status: "SENT",
        },
      });
    }
  }
};

const ensureDemoVisualWorld = async (businessId: string) => {
  const existing = await prisma.visualWorldProfile.findUnique({
    where: { businessId },
    include: {
      references: true,
      sceneRecipes: true,
    },
  });

  const profile =
    existing ||
    (await prisma.visualWorldProfile.create({
      data: {
        businessId,
        conceptSummary:
          "Sehirli restoran kimligini koruyan, ayni mekan hissini yeni kadraj ve hikayelerle yeniden uretebilen gorsel dunya.",
        sectorLens:
          "Restoran ve bistro icerikleri; mekan atmosferi, masa deneyimi, servis ritmi ve urun sunumunu birlikte tasimali.",
        ambienceNotes:
          "Aksam saatlerinde sicak ama sofistike isik, ahsap masa dokusu ve samimi premium servis hissi.",
        lightingStyle: "Sicak tungsten, yumusak kontrast, masa ustunde kontrollu parlama.",
        materialPalette: "Koyu ahsap, krem duvar, siyah detaylar, sicak metal yansimalar.",
        heroAnglesJson: JSON.stringify([
          "45 derece masa acisi",
          "giris tarafindan capraz bakis",
          "tezgah arkasindan servis ani",
        ]),
        keepElementsJson: JSON.stringify([
          "masa ve sandalye formu",
          "arka plandaki duvar tonlari",
          "markanin premium ama samimi aydinlatmasi",
        ]),
        bannedElementsJson: JSON.stringify([
          "mekana ait olmayan dekorlar",
          "asiri parlak studyo isigi",
          "marka tonunu bozan neon renkler",
        ]),
      },
    }));

  if (existing?.references.length) {
    return profile;
  }

  const assets = await prisma.asset.findMany({
    where: { businessId },
    select: { id: true, fileName: true },
  });

  for (const reference of demoVisualReferences) {
    const asset = assets.find((item) => item.fileName === reference.fileName);

    if (!asset) continue;

    await prisma.visualReferenceAsset.create({
      data: {
        profileId: profile.id,
        assetId: asset.id,
        role: reference.role,
        zone: reference.zone,
        notes: reference.notes,
        isAnchor: reference.isAnchor,
        sortOrder: reference.sortOrder,
      },
    });
  }

  if (!existing?.sceneRecipes.length) {
    for (const recipe of demoSceneRecipes) {
      await prisma.sceneRecipe.create({
        data: {
          profileId: profile.id,
          title: recipe.title,
          sceneType: recipe.sceneType,
          objective: recipe.objective,
          promptFrame: recipe.promptFrame,
          subjectNotes: recipe.subjectNotes,
          compositionNotes: recipe.compositionNotes,
          variationNotes: recipe.variationNotes,
          active: recipe.active,
        },
      });
    }
  }

  return profile;
};

const ensureDemoGenerationBriefs = async (businessId: string) => {
  const briefCount = await prisma.generationBrief.count({
    where: { businessId },
  });

  if (briefCount > 0) {
    return;
  }

  const profile = await ensureDemoVisualWorld(businessId);
  const references = await prisma.visualReferenceAsset.findMany({
    where: { profileId: profile.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, isAnchor: true },
  });
  const recipes = await prisma.sceneRecipe.findMany({
    where: { profileId: profile.id },
    select: { id: true, title: true },
  });
  const businessAssets = await prisma.asset.findMany({
    where: { businessId },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
    select: { id: true, fileName: true },
  });

  for (const brief of demoGenerationBriefs) {
    const recipe = recipes.find((item) => item.title === brief.recipeTitle);
    const selectedReferences = references
      .filter((item) => item.isAnchor)
      .map((item) => item.id);
    const selectedAssets = businessAssets
      .filter((item) =>
        brief.generationMode === "PRODUCT_IN_CONTEXT"
          ? item.fileName === "signature-burger.jpg"
          : item.fileName === "restaurant-ambience.jpg" || item.fileName === "signature-burger.jpg",
      )
      .map((item) => item.id);

    await prisma.generationBrief.create({
      data: {
        businessId,
        sceneRecipeId: recipe?.id || null,
        title: brief.title,
        generationMode: brief.generationMode,
        objective: brief.objective,
        outputType: brief.outputType,
        aspectRatio: brief.aspectRatio,
        status: brief.status,
        variationCount: brief.variationCount,
        promptDirection: brief.promptDirection,
        subjectDirection: brief.subjectDirection,
        remixInstruction: brief.remixInstruction,
        selectedReferenceIdsJson: JSON.stringify(selectedReferences),
        selectedAssetIdsJson: JSON.stringify(selectedAssets),
        keepElementsJson: brief.keepElementsJson,
      },
    });
  }
};

const regenerateAutopilotWeek = async (businessId: string) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      settings: true,
      visualWorldProfile: {
        include: {
          sceneRecipes: {
            where: { active: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      autopilotPolicy: true,
    },
  });

  if (!business) {
    return null;
  }

  const planItems = buildAutopilotSchedule({
    businessName: business.name,
    primaryGoal: business.primaryGoal,
    peakHoursJson: business.settings?.peakHoursJson,
    sceneRecipes: business.visualWorldProfile?.sceneRecipes || [],
  });

  await prisma.$transaction(async (tx) => {
    await tx.autopilotPlan.deleteMany({
      where: {
        businessId,
        source: "AI_AUTOPILOT",
        scheduledFor: {
          gte: new Date(),
        },
      },
    });

    for (const item of planItems) {
      await tx.autopilotPlan.create({
        data: {
          businessId,
          sceneRecipeId: item.sceneRecipeId,
          title: item.title,
          theme: item.theme,
          contentType: item.contentType,
          generationMode: item.generationMode,
          objective: item.objective,
          scheduledFor: item.scheduledFor,
          status: "PLANNED",
          source: "AI_AUTOPILOT",
          reasoning: item.reasoning,
        },
      });
    }

    await tx.autopilotPolicy.upsert({
      where: { businessId },
      create: {
        businessId,
        lastPlannedAt: new Date(),
      },
      update: {
        lastPlannedAt: new Date(),
      },
    });
  });

  return {
    generatedCount: planItems.length,
  };
};

const createIntakeGenerationBrief = async (input: {
  businessId: string;
  intakeType: "PRODUCT_UPDATE" | "VISUAL_WORLD_UPDATE" | "GENERAL_UPDATE";
  assetId: string;
  caption: string;
}) => {
  const business = await prisma.business.findUnique({
    where: { id: input.businessId },
    include: {
      visualWorldProfile: {
        include: {
          references: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
          sceneRecipes: {
            where: { active: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!business) {
    return null;
  }

  const anchorReferenceIds =
    business.visualWorldProfile?.references.filter((reference) => reference.isAnchor).map((reference) => reference.id) || [];

  const sceneRecipe =
    input.intakeType === "PRODUCT_UPDATE"
      ? business.visualWorldProfile?.sceneRecipes.find((item) => item.sceneType === "PRODUCT_IN_CONTEXT") ||
        business.visualWorldProfile?.sceneRecipes[0]
      : business.visualWorldProfile?.sceneRecipes.find((item) => item.sceneType === "SCENE_EXPANSION") ||
        business.visualWorldProfile?.sceneRecipes[0];

  return prisma.generationBrief.create({
    data: {
      businessId: input.businessId,
      sceneRecipeId: sceneRecipe?.id || null,
      title:
        input.intakeType === "PRODUCT_UPDATE"
          ? "Telegram intake · yeni urun briefi"
          : input.intakeType === "VISUAL_WORLD_UPDATE"
            ? "Telegram intake · mekan guncelleme briefi"
            : "Telegram intake · gorsel guncelleme briefi",
      generationMode:
        input.intakeType === "PRODUCT_UPDATE"
          ? "PRODUCT_IN_CONTEXT"
          : input.intakeType === "VISUAL_WORLD_UPDATE"
            ? "SCENE_EXPANSION"
            : "REMIX",
      objective: "PROFILE_TRAFFIC",
      outputType: "IMAGE_SET",
      aspectRatio: "4:5",
      status: "DRAFT",
      variationCount: 4,
      promptDirection: input.caption || "Telegram ile gelen yeni gorsel guncellemesini markanin dunyasina entegre et.",
      subjectDirection:
        input.intakeType === "PRODUCT_UPDATE"
          ? "Yeni urunu mekanin mevcut dunyasi icinde dogal ve premium bir sunumla one cikar."
          : "Mekandaki guncel tasarim dilini koruyarak yeni sahneler ve acilar uret.",
      remixInstruction:
        input.intakeType === "VISUAL_WORLD_UPDATE"
          ? "Gelen mekansal degisikligi anchor referanslarla birlikte kullan ve sonraki sahnelerde tutarlilastir."
          : "Gelen gorseli varyasyon kaynagi olarak kullan ve marka dilini koru.",
      selectedReferenceIdsJson: JSON.stringify(anchorReferenceIds),
      selectedAssetIdsJson: JSON.stringify([input.assetId]),
      keepElementsJson: JSON.stringify([
        "marka renk dili",
        "mekan materyal tutarliligi",
        "gercek dukkan hissi",
      ]),
    },
    include: {
      sceneRecipe: true,
    },
  });
};

const ensureDemoAutopilot = async (businessId: string) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      settings: true,
      visualWorldProfile: {
        include: {
          sceneRecipes: {
            where: { active: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      autopilotPolicy: true,
    },
  });

  if (!business) {
    return;
  }

  if (!business.autopilotPolicy) {
    await prisma.autopilotPolicy.create({
      data: {
        businessId,
        status: "ACTIVE",
        planningMode: "FULL_AUTO",
        approvalMode: business.publishMode,
        publishEnabled: true,
        allowAutoVisualGeneration: true,
        allowAutoPublishing: business.publishMode === "AUTO",
        weeklyCadenceJson: JSON.stringify({
          monday: ["POST", "REEL"],
          tuesday: ["POST", "STORY"],
          wednesday: ["POST", "REEL"],
          thursday: ["POST", "REEL"],
          friday: ["POST", "REEL"],
          saturday: ["POST", "STORY"],
          sunday: ["POST"],
        }),
        preferredTimeWindowsJson: JSON.stringify(["12:30", "19:30", "21:00"]),
        agendaSensitivityJson: JSON.stringify([
          "hava durumu degisimi",
          "yerel etkinlikler",
          "hafta sonu rezervasyon yogunlugu",
        ]),
        seasonalPriorityJson: JSON.stringify([
          "teras kullanimi",
          "hafta sonu brunch",
          "aksam servis rezervasyonu",
        ]),
        contentMixJson: JSON.stringify({
          product_in_context: 35,
          narrative_lifestyle: 30,
          scene_expansion: 20,
          remix: 15,
        }),
        generationGuardrailsJson: JSON.stringify([
          "mekan disi generic arka plan kullanma",
          "anchor referanslardaki masa ve duvar dilini bozma",
          "gorsellerde marka tonunu tutarsizlastirma",
        ]),
        lastPlannedAt: new Date(),
      },
    });
  }

  const futurePlanCount = await prisma.autopilotPlan.count({
    where: {
      businessId,
      scheduledFor: {
        gte: new Date(),
      },
    },
  });

  if (futurePlanCount > 0) {
    return;
  }

  const planItems = buildAutopilotSchedule({
    businessName: business.name,
    primaryGoal: business.primaryGoal,
    peakHoursJson: business.settings?.peakHoursJson,
    sceneRecipes: business.visualWorldProfile?.sceneRecipes || [],
  });

  for (const item of planItems) {
    await prisma.autopilotPlan.create({
      data: {
        businessId,
        sceneRecipeId: item.sceneRecipeId,
        title: item.title,
        theme: item.theme,
        contentType: item.contentType,
        generationMode: item.generationMode,
        objective: item.objective,
        scheduledFor: item.scheduledFor,
        status: "PLANNED",
        source: "AI_AUTOPILOT",
        reasoning: item.reasoning,
      },
    });
  }
};

const ensureDemoIntegrationAccount = async (businessId: string) => {
  const existing = await prisma.integrationAccount.findFirst({
    where: {
      businessId,
      provider: "instagram",
      status: "CONNECTED",
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.integrationAccount.create({
    data: {
      businessId,
      provider: "instagram",
      accountName: "Luna Bistro Instagram",
      externalAccountId: "ig_demo_luna_bistro",
      status: "CONNECTED",
      metadataJson: JSON.stringify({
        mode: "simulated_connector",
        username: "@lunabistro",
      }),
    },
  });
};

const parseIntegrationMetadata = (metadataJson: string | null) => {
  try {
    const parsed = metadataJson ? JSON.parse(metadataJson) : {};
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const parseJsonObject = (value: string | null | undefined) => {
  try {
    const parsed = value ? JSON.parse(value) : {};
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const mergeJsonString = (currentValue: string | null | undefined, patch: Record<string, unknown>) => {
  const merged = {
    ...parseJsonObject(currentValue),
    ...patch,
  };

  return JSON.stringify(merged);
};

const getMetaConfig = () => {
  const apiVersion = process.env.META_API_VERSION || "v22.0";
  return {
    apiVersion,
    appId: process.env.META_APP_ID || "",
    appSecret: process.env.META_APP_SECRET || "",
    redirectUri: process.env.META_REDIRECT_URI || "",
    publicAssetBaseUrl: process.env.PUBLIC_ASSET_BASE_URL || "",
    oauthScopes:
      process.env.META_OAUTH_SCOPES ||
      "instagram_basic,instagram_content_publish,pages_show_list,business_management",
  };
};

const getTelegramConfig = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const publicApiBaseUrl =
    process.env.TELEGRAM_WEBHOOK_BASE_URL ||
    process.env.API_PUBLIC_BASE_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "");

  return {
    token,
    publicApiBaseUrl,
    webhookUrl: publicApiBaseUrl ? `${publicApiBaseUrl.replace(/\/+$/, "")}/api/telegram/webhook` : "",
  };
};

const getTelegramApiUrl = (token: string, method: string) => {
  return `https://api.telegram.org/bot${token}/${method}`;
};

const getTelegramBotIdentity = async () => {
  const config = getTelegramConfig();

  if (!config.token) {
    return {
      ready: false,
      username: "",
      displayName: "",
      connectUrl: "",
      message: "TELEGRAM_BOT_TOKEN missing.",
    };
  }

  try {
    const response = await fetch(getTelegramApiUrl(config.token, "getMe"));
    const payload = (await response.json()) as {
      ok?: boolean;
      result?: {
        username?: string;
        first_name?: string;
      };
      description?: string;
    };

    const username = payload.result?.username || process.env.TELEGRAM_BOT_USERNAME || "";
    const displayName = payload.result?.first_name || username;

    return {
      ready: payload.ok && Boolean(username),
      username,
      displayName,
      connectUrl: username ? `https://t.me/${username}` : "",
      message: payload.ok ? "Bot identity fetched." : payload.description || "Bot identity fetch failed.",
    };
  } catch (error) {
    return {
      ready: false,
      username: process.env.TELEGRAM_BOT_USERNAME || "",
      displayName: "",
      connectUrl: process.env.TELEGRAM_BOT_USERNAME ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}` : "",
      message: error instanceof Error ? error.message : "Bot identity fetch failed.",
    };
  }
};

const buildTelegramConnectUrl = (username: string, businessId: string) => {
  if (!username) {
    return "";
  }

  return `https://t.me/${username}?start=connect_${businessId}`;
};

const buildTelegramChatTitle = (chat: {
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}) => {
  const fullName = [chat.first_name, chat.last_name].filter(Boolean).join(" ").trim();
  return chat.title || fullName || (chat.username ? `@${chat.username}` : null);
};

const upsertTelegramChatLink = async (input: {
  businessId: string;
  chatId: string;
  chatTitle?: string | null;
}) => {
  const existingLink = await prisma.telegramChatLink.findFirst({
    where: { businessId: input.businessId },
    orderBy: { createdAt: "desc" },
  });

  if (existingLink) {
    return prisma.telegramChatLink.update({
      where: { id: existingLink.id },
      data: {
        chatId: input.chatId,
        chatTitle: input.chatTitle || null,
        status: "ACTIVE",
      },
    });
  }

  return prisma.telegramChatLink.create({
    data: {
      businessId: input.businessId,
      chatId: input.chatId,
      chatTitle: input.chatTitle || null,
      status: "ACTIVE",
    },
  });
};

const fetchTelegramWebhookInfo = async () => {
  const config = getTelegramConfig();

  if (!config.token) {
    return {
      envReady: false,
      configured: false,
      targetUrl: config.webhookUrl,
      message: "TELEGRAM_BOT_TOKEN missing.",
    };
  }

  if (!config.publicApiBaseUrl) {
    return {
      envReady: false,
      configured: false,
      targetUrl: "",
      message: "TELEGRAM_WEBHOOK_BASE_URL or API_PUBLIC_BASE_URL missing.",
    };
  }

  try {
    const response = await fetch(getTelegramApiUrl(config.token, "getWebhookInfo"));
    const payload = (await response.json()) as {
      ok?: boolean;
      result?: {
        url?: string;
        pending_update_count?: number;
        last_error_message?: string;
        max_connections?: number;
      };
      description?: string;
    };

    return {
      envReady: true,
      configured: payload.ok && payload.result?.url === config.webhookUrl,
      targetUrl: config.webhookUrl,
      currentUrl: payload.result?.url || "",
      pendingUpdateCount: payload.result?.pending_update_count || 0,
      lastErrorMessage: payload.result?.last_error_message || "",
      maxConnections: payload.result?.max_connections || 0,
      message: payload.ok ? "Webhook info fetched." : payload.description || "Webhook info fetch failed.",
    };
  } catch (error) {
    return {
      envReady: true,
      configured: false,
      targetUrl: config.webhookUrl,
      message: error instanceof Error ? error.message : "Webhook info fetch failed.",
    };
  }
};

const syncTelegramWebhook = async () => {
  const config = getTelegramConfig();

  if (!config.token) {
    throw new Error("TELEGRAM_BOT_TOKEN is required.");
  }

  if (!config.publicApiBaseUrl) {
    throw new Error("TELEGRAM_WEBHOOK_BASE_URL or API_PUBLIC_BASE_URL is required.");
  }

  const response = await fetch(getTelegramApiUrl(config.token, "setWebhook"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: config.webhookUrl,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    }),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: boolean;
  };

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description || "Telegram webhook could not be updated.");
  }

  return {
    ok: true,
    targetUrl: config.webhookUrl,
    description: payload.description || "Webhook updated.",
  };
};

const maskToken = (token: string) => {
  if (!token) {
    return "";
  }

  if (token.length <= 10) {
    return `${token.slice(0, 4)}...`;
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
};

const buildPublishCaption = (input: {
  title: string;
  variant?: {
    caption?: string | null;
    cta?: string | null;
  } | null;
}) => {
  if (input.variant?.caption && input.variant?.cta) {
    return `${input.variant.caption}\n\n${input.variant.cta}`;
  }

  if (input.variant?.caption) {
    return input.variant.caption;
  }

  return input.title;
};

const buildMetaPublishPayload = (input: {
  contentItem: {
    id: string;
    title: string;
    type: string;
    variants?: Array<{
      caption?: string | null;
      cta?: string | null;
      hook?: string | null;
    }>;
  };
  selectedOutput: {
    asset: {
      storageKey: string;
      mimeType: string;
      mediaType: string;
    };
  };
  integrationMetadata: Record<string, unknown>;
}) => {
  const variant = input.contentItem.variants?.[0] || null;
  const caption = buildPublishCaption({
    title: input.contentItem.title,
    variant,
  });

  const mediaUrl = input.selectedOutput.asset.storageKey;
  const igBusinessId = String(input.integrationMetadata.igBusinessId || "");

  if (input.contentItem.type === "REEL") {
    return {
      provider: "instagram",
      mode: "META_API_READY",
      endpoint: `/${igBusinessId}/media_publish`,
      createContainer: {
        media_type: "REELS",
        video_url: mediaUrl,
        caption,
        share_to_feed: true,
      },
    };
  }

  if (input.contentItem.type === "STORY") {
    return {
      provider: "instagram",
      mode: "META_API_READY",
      endpoint: `/${igBusinessId}/media_publish`,
      createContainer: {
        media_type: "STORIES",
        image_url: mediaUrl,
      },
    };
  }

  return {
    provider: "instagram",
    mode: "META_API_READY",
    endpoint: `/${igBusinessId}/media_publish`,
    createContainer: {
      image_url: mediaUrl,
      caption,
    },
  };
};

const resolvePublicMediaUrl = (storageKey: string) => {
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }

  const config = getMetaConfig();

  if (!config.publicAssetBaseUrl) {
    return null;
  }

  return `${config.publicAssetBaseUrl.replace(/\/+$/, "")}/${storageKey.replace(/^\/+/, "")}`;
};

const executePublishAdapter = async (input: {
  job: {
    id: string;
    integrationAccount: {
      provider: string;
      accountName: string;
      metadataJson: string | null;
    };
    contentItem: {
      id: string;
      title: string;
      type: string;
      variants?: Array<{
        caption?: string | null;
        cta?: string | null;
        hook?: string | null;
      }>;
    };
  };
  selectedOutput: {
    asset: {
      storageKey: string;
      mimeType: string;
      mediaType: string;
    };
  };
}) => {
  const integrationMetadata = parseIntegrationMetadata(input.job.integrationAccount.metadataJson);
  const connectorMode = String(integrationMetadata.mode || "SIMULATED");

  if (connectorMode === "META_API_READY") {
    const payloadPreview = buildMetaPublishPayload({
      contentItem: input.job.contentItem,
      selectedOutput: input.selectedOutput,
      integrationMetadata,
    });

    const config = getMetaConfig();
    const accessToken = String(integrationMetadata.accessToken || "");
    const igBusinessId = String(integrationMetadata.igBusinessId || "");
    const createContainer = payloadPreview.createContainer || {};
    const resolvedMediaUrl =
      typeof createContainer.image_url === "string"
        ? resolvePublicMediaUrl(createContainer.image_url)
        : typeof createContainer.video_url === "string"
          ? resolvePublicMediaUrl(createContainer.video_url)
          : null;

    if (!accessToken || !igBusinessId || !resolvedMediaUrl) {
      return {
        provider: input.job.integrationAccount.provider,
        connectorMode,
        responseCode: "202",
        responseSummary:
          "Meta adapter payload hazirlandi. Canli publish icin access token, igBusinessId ve public medya URL gerekli.",
        externalPostId: `meta_preview_${randomUUID().slice(0, 10)}`,
        externalPermalink: `https://instagram.com/p/${randomUUID().slice(0, 10)}`,
        payloadPreview,
      };
    }

    const mediaEndpoint = `https://graph.facebook.com/${config.apiVersion}/${igBusinessId}/media`;
    const publishEndpoint = `https://graph.facebook.com/${config.apiVersion}/${igBusinessId}/media_publish`;
    const containerBody = new URLSearchParams();

    for (const [key, value] of Object.entries(createContainer)) {
      if (typeof value === "boolean") {
        containerBody.set(key, value ? "true" : "false");
      } else if (typeof value === "string" && value.length > 0) {
        containerBody.set(
          key,
          key === "image_url" || key === "video_url" ? resolvedMediaUrl : value,
        );
      }
    }

    containerBody.set("access_token", accessToken);

    const containerResponse = await fetch(mediaEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: containerBody.toString(),
    });

    const containerPayload = (await containerResponse.json()) as {
      id?: string;
      error?: { message?: string };
    };

    if (!containerResponse.ok || !containerPayload.id) {
      throw new Error(containerPayload.error?.message || "Meta media container olusturulamadi.");
    }

    const publishBody = new URLSearchParams();
    publishBody.set("creation_id", containerPayload.id);
    publishBody.set("access_token", accessToken);

    const publishResponse = await fetch(publishEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: publishBody.toString(),
    });

    const publishPayload = (await publishResponse.json()) as {
      id?: string;
      error?: { message?: string };
    };

    if (!publishResponse.ok || !publishPayload.id) {
      throw new Error(publishPayload.error?.message || "Meta media publish cagrisi basarisiz.");
    }

    return {
      provider: input.job.integrationAccount.provider,
      connectorMode,
      responseCode: "200",
      responseSummary: "Meta media container ve publish cagrisi basarili.",
      externalPostId: publishPayload.id,
      externalPermalink: `https://instagram.com/p/${publishPayload.id}`,
      payloadPreview: {
        ...payloadPreview,
        createContainer: {
          ...createContainer,
          image_url: typeof createContainer.image_url === "string" ? resolvedMediaUrl : undefined,
          video_url: typeof createContainer.video_url === "string" ? resolvedMediaUrl : undefined,
        },
        containerId: containerPayload.id,
        publishedMediaId: publishPayload.id,
      },
    };
  }

  return {
    provider: input.job.integrationAccount.provider,
    connectorMode: "SIMULATED",
    responseCode: "200",
    responseSummary: "Simulated Instagram publish completed.",
    externalPostId: `sim_${randomUUID().slice(0, 12)}`,
    externalPermalink: `https://instagram.com/p/${randomUUID().slice(0, 10)}`,
    payloadPreview: {
      provider: input.job.integrationAccount.provider,
      mode: "SIMULATED",
      selectedMediaUrl: input.selectedOutput.asset.storageKey,
      contentType: input.job.contentItem.type,
    },
  };
};

const inferContentItemStatus = (approvalMode: string) => {
  if (approvalMode === "AUTO") {
    return "APPROVED";
  }

  if (approvalMode === "SMART") {
    return "NEEDS_REVIEW";
  }

  return "WAITING_APPROVAL";
};

const ensurePlanBrief = async (input: {
  businessId: string;
  autopilotPlan: {
    id: string;
    title: string;
    generationMode: string;
    objective: string | null;
    sceneRecipeId: string | null;
    sceneRecipe?: {
      id: string;
      title: string;
      promptFrame: string | null;
      subjectNotes: string | null;
      compositionNotes: string | null;
      variationNotes: string | null;
    } | null;
  };
  references: Array<{
    id: string;
    role: string;
    isAnchor: boolean;
  }>;
  assets: Array<{
    id: string;
    fileName: string;
    isFeatured: boolean;
    mediaType: string;
  }>;
}) => {
  const existing = await prisma.generationBrief.findFirst({
    where: {
      businessId: input.businessId,
      sceneRecipeId: input.autopilotPlan.sceneRecipeId || null,
      generationMode: input.autopilotPlan.generationMode,
      objective: input.autopilotPlan.objective || null,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return existing;
  }

  const selectedReferenceIds = input.references.filter((item) => item.isAnchor).map((item) => item.id);
  const selectedAssetIds = input.assets
    .filter((asset) => asset.isFeatured || asset.mediaType === "IMAGE")
    .slice(0, 3)
    .map((asset) => asset.id);

  return prisma.generationBrief.create({
    data: {
      businessId: input.businessId,
      sceneRecipeId: input.autopilotPlan.sceneRecipeId || null,
      title: `${input.autopilotPlan.title} brief`,
      generationMode: input.autopilotPlan.generationMode,
      objective: input.autopilotPlan.objective || null,
      outputType: input.autopilotPlan.generationMode === "NARRATIVE_LIFESTYLE" ? "IMAGE_SET" : "IMAGE_SET",
      aspectRatio: "4:5",
      status: "READY_FOR_GENERATION",
      variationCount: input.autopilotPlan.generationMode === "NARRATIVE_LIFESTYLE" ? 4 : 3,
      promptDirection: input.autopilotPlan.sceneRecipe?.promptFrame || null,
      subjectDirection: input.autopilotPlan.sceneRecipe?.subjectNotes || null,
      remixInstruction:
        input.autopilotPlan.sceneRecipe?.variationNotes ||
        "Markanin mekan kimligini koruyarak varyasyonlar uret.",
      selectedReferenceIdsJson: JSON.stringify(selectedReferenceIds),
      selectedAssetIdsJson: JSON.stringify(selectedAssetIds),
      keepElementsJson: JSON.stringify(
        input.references
          .filter((item) => item.isAnchor)
          .map((item) => item.role),
      ),
    },
  });
};

const materializeAutopilotPlans = async (businessId: string, limit: number) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      settings: true,
      autopilotPolicy: true,
      assets: {
        orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
      },
      visualWorldProfile: {
        include: {
          references: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
          sceneRecipes: true,
        },
      },
      autopilotPlans: {
        where: {
          status: "PLANNED",
        },
        orderBy: { scheduledFor: "asc" },
        take: limit,
        include: {
          sceneRecipe: true,
        },
      },
    },
  });

  if (!business) {
    return null;
  }

  const policy = business.autopilotPolicy;
  const createdJobIds: string[] = [];

  for (const plan of business.autopilotPlans) {
    const brief = await ensurePlanBrief({
      businessId,
      autopilotPlan: plan,
      references: business.visualWorldProfile?.references || [],
      assets: business.assets,
    });

    const alreadyExists = await prisma.generationJob.findFirst({
      where: {
        autopilotPlanId: plan.id,
      },
    });

    if (alreadyExists) {
      continue;
    }

    const created = await prisma.$transaction(async (tx) => {
      const contentItem = await tx.contentItem.create({
        data: {
          businessId,
          title: plan.title,
          type: plan.contentType,
          status: inferContentItemStatus(policy?.approvalMode || business.publishMode),
          pillarName: plan.theme || "AI Autopilot",
          targetAction: plan.objective || business.primaryGoal,
          plannedFor: plan.scheduledFor,
          approvalRequired: (policy?.approvalMode || business.publishMode) !== "AUTO",
          needsClientApproval: (policy?.approvalMode || business.publishMode) === "MANUAL",
          generatedBy: "autopilot_pipeline",
        },
      });

      const job = await tx.generationJob.create({
        data: {
          businessId,
          autopilotPlanId: plan.id,
          generationBriefId: brief.id,
          contentItemId: contentItem.id,
          title: `${plan.title} generation`,
          jobType: plan.generationMode,
          status: "QUEUED",
          provider: "autopilot_internal",
          queuedFor: plan.scheduledFor,
          promptSnapshotJson: JSON.stringify({
            title: brief.title,
            promptDirection: brief.promptDirection,
            subjectDirection: brief.subjectDirection,
            remixInstruction: brief.remixInstruction,
          }),
          referenceSnapshotJson: JSON.stringify({
            selectedReferenceIds: brief.selectedReferenceIdsJson ? JSON.parse(brief.selectedReferenceIdsJson) : [],
            selectedAssetIds: brief.selectedAssetIdsJson ? JSON.parse(brief.selectedAssetIdsJson) : [],
            keepElements: brief.keepElementsJson ? JSON.parse(brief.keepElementsJson) : [],
          }),
          resultSummaryJson: JSON.stringify({
            outputType: brief.outputType,
            aspectRatio: brief.aspectRatio,
            variationCount: brief.variationCount,
          }),
        },
      });

      await tx.autopilotPlan.update({
        where: { id: plan.id },
        data: {
          status: "QUEUED_FOR_GENERATION",
        },
      });

      if ((policy?.approvalMode || business.publishMode) === "MANUAL") {
        await tx.approvalRequest.create({
          data: {
            contentItemId: contentItem.id,
            channel: "telegram_simulated",
            status: "PENDING",
          },
        });
      }

      return job;
    });

    createdJobIds.push(created.id);
  }

  return {
    createdJobIds,
  };
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const resolveGeneratedDir = () => path.join(WORKSPACE_ROOT, "apps", "web", "public", "generated");

const resolvePublicAssetPath = (storageKey: string) => {
  const normalized = storageKey.replace(/^\/+/, "");
  return path.join(WORKSPACE_ROOT, "apps", "web", "public", normalized);
};

const aspectRatioToImageSize = (aspectRatio: string) => {
  if (aspectRatio === "16:9") {
    return "1536x1024";
  }

  if (aspectRatio === "4:5" || aspectRatio === "9:16") {
    return "1024x1536";
  }

  return "1024x1024";
};

const getSelectedOutputLink = async (contentItemId: string) =>
  prisma.contentItemAsset.findFirst({
    where: {
      contentItemId,
      isSelected: true,
    },
    include: {
      asset: true,
    },
  });

const ensurePublishReady = async (contentItemId: string) => {
  const selectedOutput = await getSelectedOutputLink(contentItemId);

  if (!selectedOutput) {
    return {
      ok: false as const,
      message: "Final output secilmeden bu icerik approval veya publish asamasina gecemez.",
    };
  }

  return {
    ok: true as const,
    selectedOutput,
  };
};

const ensurePublishJobForContentItem = async (contentItemId: string) => {
  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      business: {
        include: {
          integrationAccounts: {
            where: {
              status: "CONNECTED",
              provider: "instagram",
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      publishJobs: {
        where: {
          status: { in: ["QUEUED", "RUNNING"] },
        },
        take: 1,
      },
    },
  });

  if (!contentItem) {
    return null;
  }

  const readiness = await ensurePublishReady(contentItemId);

  if (!readiness.ok) {
    throw new Error(readiness.message);
  }

  if (contentItem.publishJobs[0]) {
    return contentItem.publishJobs[0];
  }

  const integrationAccount =
    contentItem.business.integrationAccounts[0] || (await ensureDemoIntegrationAccount(contentItem.businessId));

  return prisma.publishJob.create({
    data: {
      contentItemId,
      integrationAccountId: integrationAccount.id,
      scheduledFor: contentItem.plannedFor || new Date(Date.now() + 5 * 60 * 1000),
      status: "QUEUED",
    },
  });
};

const materializePublishJobs = async (businessId: string, limit: number) => {
  await ensureDemoIntegrationAccount(businessId);

  const readyItems = await prisma.contentItem.findMany({
    where: {
      businessId,
      status: { in: ["APPROVED", "SCHEDULED"] },
      publishJobs: {
        none: {
          status: { in: ["QUEUED", "RUNNING"] },
        },
      },
    },
    orderBy: [{ plannedFor: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  const createdJobIds: string[] = [];

  for (const item of readyItems) {
    try {
      const job = await ensurePublishJobForContentItem(item.id);
      if (job) {
        createdJobIds.push(job.id);
      }
    } catch {
      continue;
    }
  }

  return {
    createdJobIds,
  };
};

const runDuePublishJobs = async (businessId: string, limit: number) => {
  const now = new Date();
  const jobs = await prisma.publishJob.findMany({
    where: {
      contentItem: {
        businessId,
      },
      status: "QUEUED",
      scheduledFor: {
        lte: now,
      },
    },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
    take: limit,
    include: {
      integrationAccount: true,
      contentItem: {
        include: {
          ...includeContentLibrary,
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  const publishedJobIds: string[] = [];

  for (const job of jobs) {
    const readiness = await ensurePublishReady(job.contentItemId);

    if (!readiness.ok) {
      await prisma.publishJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          lastError: readiness.message,
          retryCount: { increment: 1 },
        },
      });
      continue;
    }

    const adapterResult = await executePublishAdapter({
      job,
      selectedOutput: readiness.selectedOutput,
    });

    await prisma.$transaction(async (tx) => {
      await tx.publishJob.update({
        where: { id: job.id },
        data: {
          status: "RUNNING",
        },
      });

      await tx.publishAttempt.create({
        data: {
          publishJobId: job.id,
          status: "SUCCESS",
          responseCode: adapterResult.responseCode,
          responseSummary: JSON.stringify({
            summary: adapterResult.responseSummary,
            connectorMode: adapterResult.connectorMode,
            payloadPreview: adapterResult.payloadPreview,
          }),
        },
      });

      await tx.externalPost.create({
        data: {
          contentItemId: job.contentItemId,
          provider: adapterResult.provider,
          externalPostId: adapterResult.externalPostId,
          externalPermalink: adapterResult.externalPermalink,
          publishedAt: new Date(),
        },
      });

      await tx.contentItem.update({
        where: { id: job.contentItemId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      await tx.publishJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
        },
      });
    });

    publishedJobIds.push(job.id);
  }

  return {
    publishedJobIds,
  };
};

const buildProviderPrompt = (input: {
  businessName: string;
  contentTitle: string;
  generationMode: string;
  promptDirection: string | null;
  subjectDirection: string | null;
  remixInstruction: string | null;
  keepElementsJson: string | null;
}) => {
  const keepElements = (() => {
    try {
      const parsed = input.keepElementsJson ? JSON.parse(input.keepElementsJson) : [];
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  })();

  return [
    `Create a social media visual for ${input.businessName}.`,
    `Content goal: ${input.contentTitle}.`,
    `Generation mode: ${input.generationMode}.`,
    input.promptDirection ? `Creative direction: ${input.promptDirection}` : null,
    input.subjectDirection ? `Subject direction: ${input.subjectDirection}` : null,
    input.remixInstruction ? `Remix instruction: ${input.remixInstruction}` : null,
    keepElements.length > 0 ? `Keep these elements consistent: ${keepElements.join(", ")}.` : null,
    "Preserve the venue identity, materials, lighting mood, and brand world from the reference images.",
    "Output should look like a real social media photo, not a generic studio composition.",
  ]
    .filter(Boolean)
    .join("\n");
};

const loadAssetAsFile = async (asset: {
  fileName: string;
  mimeType: string;
  storageKey: string;
}) => {
  if (asset.storageKey.startsWith("http://") || asset.storageKey.startsWith("https://")) {
    const response = await fetch(asset.storageKey);

    if (!response.ok) {
      throw new Error(`Failed to fetch remote asset: ${asset.storageKey}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new File([arrayBuffer], asset.fileName, { type: asset.mimeType || "image/jpeg" });
  }

  const absolutePath = resolvePublicAssetPath(asset.storageKey);
  const buffer = await readFile(absolutePath);
  return new File([buffer], asset.fileName, { type: asset.mimeType || "image/jpeg" });
};

const saveGeneratedImage = async (buffer: Buffer, extension = "png") => {
  const generatedDir = resolveGeneratedDir();
  await mkdir(generatedDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const absolutePath = path.join(generatedDir, fileName);

  await writeFile(absolutePath, buffer);

  return {
    storageKey: `/generated/${fileName}`,
    fileName,
  };
};

const generateImagesWithOpenAI = async (input: {
  prompt: string;
  assets: Array<{
    fileName: string;
    mimeType: string;
    storageKey: string;
  }>;
  variationCount: number;
  aspectRatio: string;
}) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const endpoint = process.env.OPENAI_IMAGE_ENDPOINT || "https://api.openai.com/v1/images/edits";
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
  const quality = process.env.OPENAI_IMAGE_QUALITY || "high";
  const form = new FormData();

  form.set("model", model);
  form.set("prompt", input.prompt);
  form.set("input_fidelity", "high");
  form.set("quality", quality);
  form.set("size", aspectRatioToImageSize(input.aspectRatio));
  form.set("n", String(input.variationCount));
  form.set("output_format", "jpeg");

  for (const asset of input.assets) {
    form.append("image[]", await loadAssetAsFile(asset));
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI image generation failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ b64_json?: string | null; url?: string | null }>;
  };

  const results = payload.data || [];

  return Promise.all(
    results.map(async (item, index) => {
      if (item.b64_json) {
        const buffer = Buffer.from(item.b64_json, "base64");
        const saved = await saveGeneratedImage(buffer, "jpg");

        return {
          ...saved,
          mimeType: "image/jpeg",
          source: "openai_generated",
          sortOrder: index,
        };
      }

      if (item.url) {
        return {
          storageKey: item.url,
          fileName: `openai-generated-${index + 1}.jpg`,
          mimeType: "image/jpeg",
          source: "openai_generated",
          sortOrder: index,
        };
      }

      return null;
    }),
  ).then((items) => items.filter(Boolean) as Array<{
    storageKey: string;
    fileName: string;
    mimeType: string;
    source: string;
    sortOrder: number;
  }>);
};

const buildVariantCopy = (input: {
  title: string;
  objective: string | null;
  jobType: string;
}) => {
  const objective = input.objective || "PROFILE_TRAFFIC";

  if (input.jobType === "NARRATIVE_LIFESTYLE") {
    return {
      label: "Autopilot lifestyle",
      caption: `${input.title}. Mekanin kendi atmosferi icinde dogal bir an yaratarak markayi daha yakindan hissettir.`,
      hook: "Bu sahne tam da mekanin hissettirdigi an.",
      cta:
        objective === "RESERVATION"
          ? "Bu deneyimi yasamak icin rezervasyon olustur."
          : "Detaylar icin profili incele.",
      coverText: "Mekanin Anlari",
    };
  }

  return {
    label: "Autopilot product",
    caption: `${input.title}. Urun odakta kalirken mekanin kendi dokusu ve servis hissi korunuyor.`,
    hook: "Urunu sadece gormek degil, markanin dunyasinda hissetmek.",
    cta:
      objective === "ORDER"
        ? "Siparis veya bilgi icin DM gonder."
        : "Detaylar icin profili ziyaret et.",
    coverText: "Marka Icinde Urun",
  };
};

const runQueuedGenerationJobs = async (businessId: string, limit: number) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      autopilotPolicy: true,
      telegramChatLinks: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      generationJobs: {
        where: { status: "QUEUED" },
        orderBy: [{ queuedFor: "asc" }, { createdAt: "asc" }],
        take: limit,
        include: {
          generationBrief: true,
          contentItem: {
            include: {
              approvals: {
                where: { status: { in: ["PENDING", "SENT"] } },
              },
              variants: true,
              assets: true,
            },
          },
          autopilotPlan: true,
        },
      },
    },
  });

  if (!business) {
    return null;
  }

  const completedJobIds: string[] = [];

  for (const job of business.generationJobs) {
    const brief = job.generationBrief;
    const contentItem = job.contentItem;

    if (!brief || !contentItem) {
      continue;
    }

    const selectedAssetIds = (() => {
      try {
        const parsed = brief.selectedAssetIdsJson ? JSON.parse(brief.selectedAssetIdsJson) : [];
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    })();

    const seedAssets =
      selectedAssetIds.length > 0
        ? await prisma.asset.findMany({
            where: { id: { in: selectedAssetIds } },
            orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
          })
        : await prisma.asset.findMany({
            where: { businessId, mediaType: "IMAGE" },
            orderBy: [{ isFeatured: "desc" }, { createdAt: "asc" }],
            take: 3,
          });

    if (seedAssets.length === 0) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage: "No seed assets available for generation simulation.",
          completedAt: new Date(),
        },
      });
      continue;
    }

    const variationCount = Math.max(brief.variationCount || 1, 1);
    const variantCopy = buildVariantCopy({
      title: contentItem.title,
      objective: contentItem.targetAction,
      jobType: job.jobType,
    });

    const prompt = buildProviderPrompt({
      businessName: business.name,
      contentTitle: contentItem.title,
      generationMode: job.jobType,
      promptDirection: brief.promptDirection,
      subjectDirection: brief.subjectDirection,
      remixInstruction: brief.remixInstruction,
      keepElementsJson: brief.keepElementsJson,
    });

    let providerOutputs:
      | Array<{
          storageKey: string;
          fileName: string;
          mimeType: string;
          source: string;
          sortOrder: number;
        }>
      | null = null;

    try {
      providerOutputs = await generateImagesWithOpenAI({
        prompt,
        assets: seedAssets.map((asset) => ({
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          storageKey: asset.storageKey,
        })),
        variationCount,
        aspectRatio: brief.aspectRatio,
      });
    } catch (error) {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown provider error",
          completedAt: new Date(),
        },
      });
      continue;
    }

    const completed = await prisma.$transaction(async (tx) => {
      await tx.generationJob.update({
        where: { id: job.id },
        data: {
          status: "RUNNING",
          startedAt: new Date(),
        },
      });

      if (contentItem.variants.length === 0) {
        await tx.contentVariant.create({
          data: {
            contentItemId: contentItem.id,
            variantLabel: variantCopy.label,
            caption: variantCopy.caption,
            hook: variantCopy.hook,
            cta: variantCopy.cta,
            coverText: variantCopy.coverText,
            hashtagsJson: JSON.stringify(["brand-world", "ai-social", "autopilot"]),
          },
        });
      }

      const generatedAssetIds: string[] = [];

      const outputsToPersist =
        providerOutputs && providerOutputs.length > 0
          ? providerOutputs
          : Array.from({ length: variationCount }).map((_, index) => {
              const seedAsset = seedAssets[index % seedAssets.length];
              return {
                storageKey: seedAsset.storageKey,
                fileName: `${slugify(contentItem.title)}-${index + 1}.jpg`,
                mimeType: seedAsset.mimeType,
                source: "ai_generated_simulated",
                sortOrder: index,
              };
            });

      for (const output of outputsToPersist) {
        const generatedAsset = await tx.asset.create({
          data: {
            businessId,
            storageKey: output.storageKey,
            mimeType: output.mimeType,
            fileName: output.fileName,
            mediaType: "IMAGE",
            source: output.source,
            qualityScore: output.source === "openai_generated" ? 96 : Math.min((seedAssets[0]?.qualityScore || 88) + 2, 99),
            tags: {
              create: [
                { tag: "ai-generated" },
                { tag: output.source === "openai_generated" ? "openai-output" : "simulated-output" },
                { tag: slugify(job.jobType) || "generated" },
              ],
            },
          },
        });

        generatedAssetIds.push(generatedAsset.id);

        await tx.contentItemAsset.create({
          data: {
            contentItemId: contentItem.id,
            assetId: generatedAsset.id,
            role: "generated_output",
            isSelected: output.sortOrder === 0,
            sortOrder: output.sortOrder,
          },
        });
      }

      const requiresApproval = contentItem.approvalRequired;
      const nextContentStatus = requiresApproval ? "WAITING_APPROVAL" : "APPROVED";

      await tx.contentItem.update({
        where: { id: contentItem.id },
        data: {
          status: nextContentStatus,
        },
      });

      if (requiresApproval && contentItem.approvals.length === 0) {
        await tx.approvalRequest.create({
          data: {
            contentItemId: contentItem.id,
            channel: business.telegramChatLinks[0] ? "telegram" : "telegram_simulated",
            telegramChatId: business.telegramChatLinks[0]?.chatId || null,
            status: "PENDING",
          },
        });
      }

      return tx.generationJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          provider: providerOutputs && providerOutputs.length > 0 ? "openai_images" : "autopilot_internal",
          resultSummaryJson: JSON.stringify({
            generatedAssetIds,
            variationCount: outputsToPersist.length,
            nextContentStatus,
            providerMode: providerOutputs && providerOutputs.length > 0 ? "openai" : "simulated",
          }),
        },
      });
    });

    completedJobIds.push(completed.id);
  }

  return {
    completedJobIds,
  };
};

const ensureDemoWorkspace = async () => {
  const existingWorkspace = await prisma.workspace.findUnique({
    where: { slug: DEMO_WORKSPACE_SLUG },
    include: {
      businesses: {
        take: 1,
      },
    },
  });

  if (existingWorkspace) {
    if (existingWorkspace.businesses[0]) {
      await ensureDemoAssets(existingWorkspace.businesses[0].id);
      await ensureDemoContentItems(existingWorkspace.businesses[0].id);
      await ensureDemoApprovals(existingWorkspace.businesses[0].id);
      await ensureDemoVisualWorld(existingWorkspace.businesses[0].id);
      await ensureDemoGenerationBriefs(existingWorkspace.businesses[0].id);
      await ensureDemoAutopilot(existingWorkspace.businesses[0].id);
    }

    return existingWorkspace;
  }

  const createdWorkspace = await prisma.workspace.create({
    data: {
      name: "Demo Studio",
      slug: DEMO_WORKSPACE_SLUG,
      timezone: "Europe/Istanbul",
      businesses: {
        create: {
          name: "Luna Bistro",
          category: "Restaurant",
          description:
            "Modern sehir restoranı. Aksam servisinde rezervasyon odakli, gunduz daha rahat ve hizli bir deneyim sunuyor.",
          priceSegment: "Mid Premium",
          address: "Nispetiye Cd. No: 24",
          city: "Istanbul",
          country: "Turkey",
          phone: "+90 555 123 45 67",
          websiteUrl: "https://lunabistro.example",
          primaryGoal: "RESERVATION",
          reservationUrl: "https://lunabistro.example/reservation",
          whatsappUrl: "https://wa.me/905551234567",
          publishMode: "SMART",
          settings: {
            create: {
              preferredLanguage: "tr",
              toneSummary: "samimi, sehirli, premium ama ulasilabilir",
              ctaPreferencesJson: JSON.stringify([
                "Hemen rezervasyon olustur",
                "Aksam servisi icin DM at",
                "Mekani arkadasinla paylas",
              ]),
              forbiddenPhrasesJson: JSON.stringify([
                "son sans",
                "inanilmaz firsat",
                "asiri indirim",
              ]),
              targetAudienceJson: JSON.stringify([
                "25-40 sehirli profesyoneller",
                "aksam bulusmasi yapan ciftler",
                "hafta sonu brunch kitlesi",
              ]),
              peakHoursJson: JSON.stringify(["12:30", "19:30", "21:00"]),
              seasonalNotesJson: JSON.stringify([
                "ilkbaharda teras vurgusu",
                "hafta sonu brunch menusu one ciksin",
              ]),
            },
          },
          brandProfiles: {
            create: {
              summary:
                "Sehirli ama sicak bir restoran. Gorselde premium tabak sunumu, metinde ise samimi ve davetkar bir ton tercih edilir.",
              voiceGuidelines:
                "Kisa cumleler, net CTA ve yapay hissettirmeyen dogal anlatim kullan.",
              visualGuidelines:
                "Sicak tonlar, karanlik ama sofistike masa detaylari ve yakin plan urun cekimleri one cikar.",
              customerPersonasJson: JSON.stringify([
                "aksam cikisi icin mekan arayan beyaz yaka",
                "hafta sonu sosyal bulusma planlayan grup",
              ]),
              strategyNotes:
                "Reels tarafinda hazirlik sureci ve servis anlari daha iyi performans verir.",
            },
          },
          contentPillars: {
            create: [
              {
                name: "Signature tabaklar",
                description: "En guclu urunleri hero shot ve yakin planla one cikar.",
                priority: 1,
              },
              {
                name: "Mekan atmosferi",
                description: "Ambiyans, masa duzeni ve aksama dogru olusan enerjiyi goster.",
                priority: 2,
              },
              {
                name: "Rezervasyon CTA",
                description: "Ozellikle persembe-cumartesi arasi aksiyon odakli icerikler.",
                priority: 3,
              },
            ],
          },
        },
      },
    },
  });

  const createdBusiness = await prisma.business.findFirst({
    where: { workspaceId: createdWorkspace.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (createdBusiness) {
    await ensureDemoAssets(createdBusiness.id);
    await ensureDemoContentItems(createdBusiness.id);
    await ensureDemoApprovals(createdBusiness.id);
    await ensureDemoVisualWorld(createdBusiness.id);
    await ensureDemoGenerationBriefs(createdBusiness.id);
    await ensureDemoAutopilot(createdBusiness.id);
  }

  return createdWorkspace;
};

const buildTelegramPreview = (input: {
  approvalRequestId?: string;
  businessName: string;
  contentTitle: string;
  type: string;
  plannedFor: Date | null;
  targetAction: string | null;
}) => {
  const plannedText = input.plannedFor ? input.plannedFor.toLocaleString("tr-TR") : "Planlanmadi";

  return {
    text: [
      `Onay bekleyen icerik: ${input.contentTitle}`,
      `Isletme: ${input.businessName}`,
      `Tip: ${input.type}`,
      `Planlanan saat: ${plannedText}`,
      `Hedef aksiyon: ${input.targetAction || "Belirtilmedi"}`,
    ].join("\n"),
    callbacks: [
      `APPROVE:${input.approvalRequestId || "pending"}`,
      `REVISE:${input.approvalRequestId || "pending"}`,
      `REJECT:${input.approvalRequestId || "pending"}`,
    ],
  };
};

const buildTelegramActionResponse = (input: {
  intent: string;
  status: string;
  result: Record<string, unknown>;
}) => {
  if (input.intent === "PUBLISH_MODE_CHANGE" && input.status === "APPLIED") {
    return `Yayin modu guncellendi. Yeni mod: ${String(input.result.publishMode || "MANUAL")}.`;
  }

  if (input.intent === "PRODUCT_UPDATE" && input.status === "APPLIED") {
    return `Yeni urun intake alindi. ${
      String(input.result.productName || "Yeni urun")
    } icin brief olusturuldu ve plan yeniden degerlendirildi.`;
  }

  if (input.intent === "CAMPAIGN_REQUEST" && input.status === "APPLIED") {
    return "Kampanya talebi kaydedildi. Sistem buna uygun icerik briefleri olusturacak.";
  }

  if (input.intent === "CONTENT_PRIORITY_SHIFT" && input.status === "APPLIED") {
    return "Haftalik icerik onceligi guncellendi. Yeni odak bir sonraki planlamada dikkate alinacak.";
  }

  if (input.intent === "CONTENT_STYLE_SHIFT" && input.status === "APPLIED") {
    return "Icerik karmasi guncellendi. Mekan ve atmosfer agirligi yeni planlara yansitilacak.";
  }

  if (input.status === "NEEDS_INPUT") {
    return String(input.result.message || "Bu islem icin biraz daha bilgi gerekli.");
  }

  if (input.status === "ESCALATED") {
    return "Bu talep operator incelemesine alindi.";
  }

  return "Talep alindi ve sisteme islendi.";
};

const buildTelegramMediaResponse = (input: {
  intakeType: string;
  productId: string | null;
  generatedBriefId: string | null;
  replanGeneratedCount: number;
}) => {
  if (input.intakeType === "PRODUCT_UPDATE") {
    return `Yeni urun gorseli kaydedildi. Urun intake'i acildi, yeni brief olusturuldu ve ${input.replanGeneratedCount} slot yeniden planlandi.`;
  }

  if (input.intakeType === "VISUAL_WORLD_UPDATE") {
    return `Mekan guncellemesi kaydedildi. Visual World referansi yenilendi ve ${input.replanGeneratedCount} slot yeniden planlandi.`;
  }

  return `Gorsel guncelleme kaydedildi. Sistem yeni referansi sonraki uretimlerde kullanacak.`;
};

const classifyTelegramMediaCaption = (caption: string) => {
  const normalized = caption.toLowerCase().trim();

  if (
    normalized.includes("yeni urun") ||
    normalized.includes("urun eklendi") ||
    normalized.includes("menuye eklendi")
  ) {
    return {
      intakeType: "PRODUCT_UPDATE",
      role: "product_update",
      tags: ["telegram-upload", "product-update", "new-product"],
    };
  }

  if (
    normalized.includes("mekan") ||
    normalized.includes("tasarim") ||
    normalized.includes("masa") ||
    normalized.includes("sandalye") ||
    normalized.includes("dekor") ||
    normalized.includes("vitrin")
  ) {
    return {
      intakeType: "VISUAL_WORLD_UPDATE",
      role: "venue_update",
      tags: ["telegram-upload", "venue-update", "visual-refresh"],
    };
  }

  return {
    intakeType: "GENERAL_UPDATE",
    role: "telegram_update",
    tags: ["telegram-upload", "general-update"],
  };
};

const createTelegramMediaIntake = async (input: {
  businessId: string;
  chatId: string;
  caption: string;
  fileId: string;
  mediaType: "IMAGE" | "VIDEO";
  mimeType: string;
  fileName: string;
}) => {
  const classified = classifyTelegramMediaCaption(input.caption);
  const business = await prisma.business.findUnique({
    where: { id: input.businessId },
    include: {
      visualWorldProfile: true,
    },
  });

  if (!business) {
    throw new Error("Business not found.");
  }

  const created = await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: {
        businessId: input.businessId,
        fileName: input.fileName,
        storageKey: `telegram://${input.fileId}`,
        mimeType: input.mimeType,
        mediaType: input.mediaType,
        source: "telegram_upload",
        uploadedBy: input.chatId,
        qualityScore: 70,
        tags: {
          create: classified.tags.map((tag) => ({ tag })),
        },
      },
      include: includeAssetLibrary,
    });

    let productId: string | null = null;
    let visualReferenceId: string | null = null;

    if (classified.intakeType === "PRODUCT_UPDATE") {
      const productName = extractProductNameFromCommand(input.caption);

      if (productName) {
        const product = await tx.product.create({
          data: {
            businessId: input.businessId,
            name: productName,
            description: "Telegram gorsel bildirimi ile eklenen urun taslagi",
            category: "TELEGRAM_INTAKE",
            priorityScore: 55,
          },
        });

        productId = product.id;
      }
    }

    if (classified.intakeType === "VISUAL_WORLD_UPDATE") {
      const profile = await tx.visualWorldProfile.upsert({
        where: { businessId: input.businessId },
        create: { businessId: input.businessId },
        update: {},
      });

      const visualReference = await tx.visualReferenceAsset.create({
        data: {
          profileId: profile.id,
          assetId: asset.id,
          role: classified.role,
          notes: input.caption || "Telegram ile gelen mekan guncellemesi",
          isAnchor: false,
          sortOrder: 999,
        },
      });

      visualReferenceId = visualReference.id;
    }

    return {
      asset,
      intakeType: classified.intakeType,
      productId,
      visualReferenceId,
    };
  });

  const generatedBrief = await createIntakeGenerationBrief({
    businessId: input.businessId,
    intakeType: created.intakeType as "PRODUCT_UPDATE" | "VISUAL_WORLD_UPDATE" | "GENERAL_UPDATE",
    assetId: created.asset.id,
    caption: input.caption,
  });

  const replanResult = await regenerateAutopilotWeek(input.businessId);

  const responseText = buildTelegramMediaResponse({
    intakeType: created.intakeType,
    productId: created.productId,
    generatedBriefId: generatedBrief?.id || null,
    replanGeneratedCount: replanResult?.generatedCount || 0,
  });

  await prisma.telegramCommandRun.create({
    data: {
      businessId: input.businessId,
      source: "telegram",
      commandText: input.caption || "[telegram media intake]",
      normalizedText: (input.caption || "[telegram media intake]").toLowerCase().trim(),
      intent: created.intakeType,
      actionType: "MEDIA_INTAKE",
      status: "APPLIED",
      summary: "Telegram ile gorsel guncellemesi alindi.",
      payloadJson: JSON.stringify({
        fileId: input.fileId,
        mediaType: input.mediaType,
      }),
      resultJson: JSON.stringify({
        intakeType: created.intakeType,
        assetId: created.asset.id,
        productId: created.productId,
        visualReferenceId: created.visualReferenceId,
        generatedBriefId: generatedBrief?.id || null,
        replanGeneratedCount: replanResult?.generatedCount || 0,
        responseText,
      }),
    },
  });

  return {
    ...created,
    generatedBriefId: generatedBrief?.id || null,
    replanGeneratedCount: replanResult?.generatedCount || 0,
    responseText,
  };
};

const telegramCommandPresets = [
  "bu hafta tatliyi one cikar",
  "yarin kampanya baslat",
  "sadece onaya gonder",
  "bu hafta otomatik yayinla",
  "mekan agirlikli ilerle",
  "yeni urun ekle",
];

const interpretTelegramCommand = (command: string) => {
  const normalized = command.toLowerCase().trim();

  if (normalized.includes("tatli") && normalized.includes("one")) {
    return {
      intent: "CONTENT_PRIORITY_SHIFT",
      summary: "Bu hafta tatli kategorisini one cikar.",
      suggestedAction: {
        type: "UPDATE_WEEKLY_PRIORITY",
        payload: {
          pillar: "tatli",
          boost: true,
        },
      },
    };
  }

  if (normalized.includes("otomatik") && normalized.includes("yayin")) {
    return {
      intent: "PUBLISH_MODE_CHANGE",
      summary: "Yayin modu otomatik yayina alinmak istiyor.",
      suggestedAction: {
        type: "SET_PUBLISH_MODE",
        payload: {
          publishMode: "AUTO",
        },
      },
    };
  }

  if (normalized.includes("onay")) {
    return {
      intent: "APPROVAL_MODE_CHANGE",
      summary: "Iceriklerin once onaya dusmesi istendi.",
      suggestedAction: {
        type: "SET_PUBLISH_MODE",
        payload: {
          publishMode: "MANUAL",
        },
      },
    };
  }

  if (normalized.includes("kampanya")) {
    return {
      intent: "CAMPAIGN_REQUEST",
      summary: "Yeni kampanya yayini isteniyor.",
      suggestedAction: {
        type: "CREATE_CAMPAIGN_BRIEF",
        payload: {
          theme: "kampanya",
          requestedFromCommand: command,
        },
      },
    };
  }

  if (normalized.includes("yeni urun")) {
    return {
      intent: "PRODUCT_UPDATE",
      summary: "Yeni urun ekleme akisi tetiklenmeli.",
      suggestedAction: {
        type: "START_PRODUCT_INTAKE",
        payload: {
          requestedFromCommand: command,
        },
      },
    };
  }

  if (normalized.includes("mekan")) {
    return {
      intent: "CONTENT_STYLE_SHIFT",
      summary: "Mekan ve atmosfer agirlikli icerik isteniyor.",
      suggestedAction: {
        type: "UPDATE_CONTENT_MIX",
        payload: {
          focus: "venue_atmosphere",
        },
      },
    };
  }

  return {
    intent: "GENERAL_OPERATOR_REVIEW",
    summary: "Komut operator incelemesine yonlendirilmeli.",
    suggestedAction: {
      type: "ESCALATE_TO_OPERATOR",
      payload: {
        requestedFromCommand: command,
      },
    },
  };
};

const extractProductNameFromCommand = (command: string) => {
  const normalized = command.trim();
  const match =
    normalized.match(/yeni urun ekle[:\s-]+(.+)/i) ||
    normalized.match(/yeni urun[:\s-]+(.+)/i) ||
    normalized.match(/urun ekle[:\s-]+(.+)/i);

  return match?.[1]?.trim() || "";
};

const applyTelegramCommand = async (input: {
  businessId: string;
  command: string;
  source: "dashboard" | "telegram";
}) => {
  const interpretation = interpretTelegramCommand(input.command);
  const normalizedText = input.command.toLowerCase().trim();
  const actionType = interpretation.suggestedAction.type;
  const payload = interpretation.suggestedAction.payload as Record<string, unknown>;

  const business = await prisma.business.findUnique({
    where: { id: input.businessId },
    include: {
      autopilotPolicy: true,
    },
  });

  if (!business) {
    throw new Error("Business not found.");
  }

  let status = "APPLIED";
  let result: Record<string, unknown> = {};

  await prisma.$transaction(async (tx) => {
    if (actionType === "SET_PUBLISH_MODE") {
      const publishMode = String(payload.publishMode || "MANUAL");
      const approvalMode = publishMode === "AUTO" ? "AUTO" : publishMode === "SMART" ? "SMART" : "MANUAL";

      await tx.business.update({
        where: { id: input.businessId },
        data: {
          publishMode,
        },
      });

      await tx.autopilotPolicy.upsert({
        where: { businessId: input.businessId },
        create: {
          businessId: input.businessId,
          approvalMode,
          allowAutoPublishing: publishMode === "AUTO",
        },
        update: {
          approvalMode,
          allowAutoPublishing: publishMode === "AUTO",
        },
      });

      result = {
        applied: true,
        publishMode,
        approvalMode,
        allowAutoPublishing: publishMode === "AUTO",
      };
    } else if (actionType === "UPDATE_WEEKLY_PRIORITY") {
      const currentMix = parseJsonObject(business.autopilotPolicy?.contentMixJson);
      const priorityFocus = {
        category: String(payload.pillar || "general"),
        boost: Boolean(payload.boost),
        requestedAt: new Date().toISOString(),
      };

      const contentMixJson = JSON.stringify({
        ...currentMix,
        priorityFocus,
      });

      await tx.autopilotPolicy.upsert({
        where: { businessId: input.businessId },
        create: {
          businessId: input.businessId,
          contentMixJson,
        },
        update: {
          contentMixJson,
        },
      });

      result = {
        applied: true,
        contentMixJson: parseJsonObject(contentMixJson),
      };
    } else if (actionType === "UPDATE_CONTENT_MIX") {
      const currentMix = parseJsonObject(business.autopilotPolicy?.contentMixJson);
      const contentMixJson = JSON.stringify({
        ...currentMix,
        visualFocus: String(payload.focus || "balanced"),
        requestedAt: new Date().toISOString(),
      });

      await tx.autopilotPolicy.upsert({
        where: { businessId: input.businessId },
        create: {
          businessId: input.businessId,
          contentMixJson,
        },
        update: {
          contentMixJson,
        },
      });

      result = {
        applied: true,
        contentMixJson: parseJsonObject(contentMixJson),
      };
    } else if (actionType === "CREATE_CAMPAIGN_BRIEF") {
      const campaign = await tx.campaign.create({
        data: {
          businessId: input.businessId,
          name: `Telegram talebi · ${new Date().toLocaleDateString("tr-TR")}`,
          description: String(payload.requestedFromCommand || input.command),
          objective: "PROMOTION",
          status: "DRAFT",
          createdBy: input.source,
        },
      });

      result = {
        applied: true,
        campaignId: campaign.id,
        campaignName: campaign.name,
      };
    } else if (actionType === "START_PRODUCT_INTAKE") {
      const productName = extractProductNameFromCommand(input.command);

      if (productName) {
        const product = await tx.product.create({
          data: {
            businessId: input.businessId,
            name: productName,
            description: "Telegram komutu ile eklenen taslak urun",
            category: "NEW_INTAKE",
            priorityScore: 60,
          },
        });

        result = {
          applied: true,
          productId: product.id,
          productName: product.name,
          mode: "PRODUCT_CREATED",
        };
      } else {
        status = "NEEDS_INPUT";
        result = {
          applied: false,
          mode: "PRODUCT_DETAILS_REQUIRED",
          message: "Yeni urun icin isim ve tercihen fiyat/foto bilgisi gerekli.",
          suggestedReply: "ornek: yeni urun ekle San Sebastian cheesecake 220 TL",
        };
      }
    } else if (actionType === "ESCALATE_TO_OPERATOR") {
      status = "ESCALATED";
      result = {
        applied: false,
        mode: "OPERATOR_REVIEW",
      };
    } else {
      status = "ESCALATED";
      result = {
        applied: false,
        mode: "UNHANDLED_ACTION",
      };
    }

    await tx.telegramCommandRun.create({
      data: {
        businessId: input.businessId,
        source: input.source,
        commandText: input.command,
        normalizedText,
        intent: interpretation.intent,
        actionType,
        status,
        summary: interpretation.summary,
        payloadJson: JSON.stringify(payload),
        resultJson: JSON.stringify(result),
      },
    });
  });

  const updatedBusiness = await prisma.business.findUnique({
    where: { id: input.businessId },
    select: {
      publishMode: true,
      autopilotPolicy: true,
    },
  });

  const responseText = buildTelegramActionResponse({
    intent: interpretation.intent,
    status,
    result,
  });

  await prisma.telegramCommandRun.updateMany({
    where: {
      businessId: input.businessId,
      source: input.source,
      commandText: input.command,
      intent: interpretation.intent,
      actionType,
      status,
    },
    data: {
      resultJson: JSON.stringify({
        ...result,
        responseText,
      }),
    },
  });

  return {
    interpretation,
    application: {
      status,
      result,
      responseText,
      publishMode: updatedBusiness?.publishMode || business.publishMode,
      autopilotPolicy: updatedBusiness?.autopilotPolicy || business.autopilotPolicy,
    },
  };
};

const applyApprovalDecision = async (approvalRequestId: string, action: "APPROVE" | "REVISE" | "REJECT", note?: string) => {
  const approvalRequest = await prisma.approvalRequest.findUnique({
    where: { id: approvalRequestId },
    include: {
      contentItem: {
        include: {
          business: {
            include: {
              autopilotPolicy: true,
            },
          },
        },
      },
    },
  });

  if (!approvalRequest) {
    return null;
  }

  if (action === "APPROVE") {
    const readiness = await ensurePublishReady(approvalRequest.contentItemId);

    if (!readiness.ok) {
      throw new Error(readiness.message);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    let nextApprovalStatus = approvalRequest.status;
    let nextContentStatus = approvalRequest.contentItem.status;

    if (action === "APPROVE") {
      nextApprovalStatus = "APPROVED";
      nextContentStatus = approvalRequest.contentItem.business.autopilotPolicy?.allowAutoPublishing ? "SCHEDULED" : "APPROVED";
    }

    if (action === "REVISE") {
      nextApprovalStatus = "REVISED";
      nextContentStatus = "NEEDS_REVIEW";

      await tx.revisionRequest.create({
        data: {
          contentItemId: approvalRequest.contentItemId,
          source: "telegram_or_web",
          reasonCode: "REVISION_REQUESTED",
          note: note || null,
          status: "OPEN",
        },
      });
    }

    if (action === "REJECT") {
      nextApprovalStatus = "REJECTED";
      nextContentStatus = "ARCHIVED";
    }

    await tx.approvalAction.create({
      data: {
        approvalRequestId,
        channel: "telegram_or_web",
        action,
        note: note || null,
      },
    });

    await tx.approvalRequest.update({
      where: { id: approvalRequestId },
      data: {
        status: nextApprovalStatus,
        resolvedAt: new Date(),
      },
    });

    await tx.contentItem.update({
      where: { id: approvalRequest.contentItemId },
      data: {
        status: nextContentStatus,
      },
    });

    return tx.approvalRequest.findUnique({
      where: { id: approvalRequestId },
      include: {
        contentItem: true,
        actions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  });

  if (action === "APPROVE" && approvalRequest.contentItem.business.autopilotPolicy?.allowAutoPublishing) {
    await ensurePublishJobForContentItem(approvalRequest.contentItemId);
  }

  return result;
};

app.get("/health", async () => {
  return { ok: true, service: "api", timestamp: new Date().toISOString() };
});

app.get("/api/dashboard/summary", async () => {
  const [workspaceCount, businessCount, contentCount, pendingApprovalCount] = await Promise.all([
    prisma.workspace.count(),
    prisma.business.count(),
    prisma.contentItem.count(),
    prisma.approvalRequest.count({
      where: { status: { in: ["PENDING", "SENT"] } },
    }),
  ]);

  return {
    workspaceCount,
    businessCount,
    contentCount,
    pendingApprovalCount,
  };
});

app.get("/api/workspaces/:slug/businesses", async (request, reply) => {
  const paramsSchema = z.object({
    slug: z.string().min(2),
  });

  const { slug } = paramsSchema.parse(request.params);

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      businesses: {
        orderBy: { createdAt: "asc" },
        include: includeBusinessProfile,
      },
    },
  });

  if (!workspace) {
    reply.code(404);
    return { message: "Workspace not found" };
  }

  return workspace;
});

app.post("/api/businesses", async (request, reply) => {
  const body = createBusinessSchema.parse(request.body);

  const business = await prisma.business.create({
    data: {
      workspaceId: body.workspaceId,
      name: body.name,
      category: body.category,
      city: body.city,
      country: body.country,
      primaryGoal: body.primaryGoal,
    },
  });

  reply.code(201);
  return business;
});

app.patch("/api/businesses/:businessId", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = updateBusinessSchema.parse(request.body);

  const business = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: body.name,
      category: body.category,
      description: body.description || null,
      priceSegment: body.priceSegment || null,
      address: body.address || null,
      city: body.city,
      country: body.country,
      phone: body.phone || null,
      websiteUrl: body.websiteUrl || null,
      reservationUrl: body.reservationUrl || null,
      whatsappUrl: body.whatsappUrl || null,
      primaryGoal: body.primaryGoal,
      operatingMode: body.operatingMode,
      dashboardAccessEnabled: body.dashboardAccessEnabled,
      telegramControlEnabled: body.telegramControlEnabled,
      publishMode: body.publishMode,
      settings: {
        upsert: {
          create: {
            preferredLanguage: body.preferredLanguage,
            toneSummary: body.toneSummary || null,
            ctaPreferencesJson: body.ctaPreferencesJson || null,
            forbiddenPhrasesJson: body.forbiddenPhrasesJson || null,
            targetAudienceJson: body.targetAudienceJson || null,
            peakHoursJson: body.peakHoursJson || null,
            seasonalNotesJson: body.seasonalNotesJson || null,
          },
          update: {
            preferredLanguage: body.preferredLanguage,
            toneSummary: body.toneSummary || null,
            ctaPreferencesJson: body.ctaPreferencesJson || null,
            forbiddenPhrasesJson: body.forbiddenPhrasesJson || null,
            targetAudienceJson: body.targetAudienceJson || null,
            peakHoursJson: body.peakHoursJson || null,
            seasonalNotesJson: body.seasonalNotesJson || null,
          },
        },
      },
    },
    include: includeBusinessProfile,
  });

  reply.code(200);
  return business;
});

app.get("/api/businesses/:businessId", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: includeBusinessProfile,
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  return business;
});

app.get("/api/businesses/:businessId/assets", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      assets: {
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: includeAssetLibrary,
      },
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  return business;
});

app.get("/api/businesses/:businessId/visual-world", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      category: true,
      assets: {
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: includeAssetLibrary,
      },
      ...includeVisualWorldProfile,
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  if (!business.visualWorldProfile) {
    await ensureDemoVisualWorld(businessId);

    const refreshedBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        category: true,
        assets: {
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          include: includeAssetLibrary,
        },
        ...includeVisualWorldProfile,
      },
    });

    return refreshedBusiness;
  }

  return business;
});

app.patch("/api/businesses/:businessId/visual-world", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = updateVisualWorldSchema.parse(request.body);

  const profile = await prisma.visualWorldProfile.upsert({
    where: { businessId },
    create: {
      businessId,
      conceptSummary: body.conceptSummary || null,
      sectorLens: body.sectorLens || null,
      ambienceNotes: body.ambienceNotes || null,
      lightingStyle: body.lightingStyle || null,
      materialPalette: body.materialPalette || null,
      heroAnglesJson: body.heroAnglesJson || null,
      keepElementsJson: body.keepElementsJson || null,
      bannedElementsJson: body.bannedElementsJson || null,
    },
    update: {
      conceptSummary: body.conceptSummary || null,
      sectorLens: body.sectorLens || null,
      ambienceNotes: body.ambienceNotes || null,
      lightingStyle: body.lightingStyle || null,
      materialPalette: body.materialPalette || null,
      heroAnglesJson: body.heroAnglesJson || null,
      keepElementsJson: body.keepElementsJson || null,
      bannedElementsJson: body.bannedElementsJson || null,
    },
    include: {
      references: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          asset: {
            include: includeAssetLibrary,
          },
        },
      },
      sceneRecipes: {
        orderBy: [{ active: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  return profile;
});

app.post("/api/businesses/:businessId/visual-world/references", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = createVisualReferenceSchema.parse(request.body);

  const profile = await prisma.visualWorldProfile.upsert({
    where: { businessId },
    create: { businessId },
    update: {},
  });

  const reference = await prisma.visualReferenceAsset.create({
    data: {
      profileId: profile.id,
      assetId: body.assetId,
      role: body.role,
      zone: body.zone || null,
      notes: body.notes || null,
      isAnchor: body.isAnchor,
      sortOrder: body.sortOrder,
    },
    include: {
      asset: {
        include: includeAssetLibrary,
      },
    },
  });

  reply.code(201);
  return reference;
});

app.patch("/api/visual-world-references/:referenceId", async (request, reply) => {
  const paramsSchema = z.object({
    referenceId: z.string().uuid(),
  });

  const { referenceId } = paramsSchema.parse(request.params);
  const body = updateVisualReferenceSchema.parse(request.body);

  const existing = await prisma.visualReferenceAsset.findUnique({
    where: { id: referenceId },
  });

  if (!existing) {
    reply.code(404);
    return { message: "Visual reference not found" };
  }

  const reference = await prisma.visualReferenceAsset.update({
    where: { id: referenceId },
    data: {
      assetId: body.assetId || existing.assetId,
      role: body.role || existing.role,
      zone: body.zone === undefined ? existing.zone : body.zone || null,
      notes: body.notes === undefined ? existing.notes : body.notes || null,
      isAnchor: body.isAnchor ?? existing.isAnchor,
      sortOrder: body.sortOrder ?? existing.sortOrder,
    },
    include: {
      asset: {
        include: includeAssetLibrary,
      },
    },
  });

  return reference;
});

app.post("/api/businesses/:businessId/scene-recipes", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = createSceneRecipeSchema.parse(request.body);

  const profile = await prisma.visualWorldProfile.upsert({
    where: { businessId },
    create: { businessId },
    update: {},
  });

  const recipe = await prisma.sceneRecipe.create({
    data: {
      profileId: profile.id,
      title: body.title,
      sceneType: body.sceneType,
      objective: body.objective || null,
      promptFrame: body.promptFrame || null,
      subjectNotes: body.subjectNotes || null,
      compositionNotes: body.compositionNotes || null,
      variationNotes: body.variationNotes || null,
      active: body.active,
    },
  });

  reply.code(201);
  return recipe;
});

app.patch("/api/scene-recipes/:recipeId", async (request, reply) => {
  const paramsSchema = z.object({
    recipeId: z.string().uuid(),
  });

  const { recipeId } = paramsSchema.parse(request.params);
  const body = updateSceneRecipeSchema.parse(request.body);

  const existing = await prisma.sceneRecipe.findUnique({
    where: { id: recipeId },
  });

  if (!existing) {
    reply.code(404);
    return { message: "Scene recipe not found" };
  }

  const recipe = await prisma.sceneRecipe.update({
    where: { id: recipeId },
    data: {
      title: body.title || existing.title,
      sceneType: body.sceneType || existing.sceneType,
      objective: body.objective === undefined ? existing.objective : body.objective || null,
      promptFrame: body.promptFrame === undefined ? existing.promptFrame : body.promptFrame || null,
      subjectNotes: body.subjectNotes === undefined ? existing.subjectNotes : body.subjectNotes || null,
      compositionNotes:
        body.compositionNotes === undefined ? existing.compositionNotes : body.compositionNotes || null,
      variationNotes: body.variationNotes === undefined ? existing.variationNotes : body.variationNotes || null,
      active: body.active ?? existing.active,
    },
  });

  return recipe;
});

app.get("/api/businesses/:businessId/generate-studio", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      category: true,
      assets: {
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: includeAssetLibrary,
      },
      generationBriefs: {
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        include: {
          sceneRecipe: true,
        },
      },
      ...includeVisualWorldProfile,
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  await ensureDemoVisualWorld(businessId);
  await ensureDemoGenerationBriefs(businessId);

  const refreshedBusiness = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      category: true,
      assets: {
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: includeAssetLibrary,
      },
      generationBriefs: {
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        include: {
          sceneRecipe: true,
        },
      },
      ...includeVisualWorldProfile,
    },
  });

  return refreshedBusiness || business;
});

app.post("/api/businesses/:businessId/generation-briefs", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = createGenerationBriefSchema.parse(request.body);

  const brief = await prisma.generationBrief.create({
    data: {
      businessId,
      sceneRecipeId: body.sceneRecipeId || null,
      title: body.title,
      generationMode: body.generationMode,
      objective: body.objective || null,
      outputType: body.outputType || "IMAGE_SET",
      aspectRatio: body.aspectRatio || "4:5",
      status: body.status || "DRAFT",
      variationCount: body.variationCount,
      promptDirection: body.promptDirection || null,
      subjectDirection: body.subjectDirection || null,
      remixInstruction: body.remixInstruction || null,
      selectedReferenceIdsJson: body.selectedReferenceIdsJson || null,
      selectedAssetIdsJson: body.selectedAssetIdsJson || null,
      keepElementsJson: body.keepElementsJson || null,
    },
    include: {
      sceneRecipe: true,
    },
  });

  reply.code(201);
  return brief;
});

app.patch("/api/generation-briefs/:briefId", async (request, reply) => {
  const paramsSchema = z.object({
    briefId: z.string().uuid(),
  });

  const { briefId } = paramsSchema.parse(request.params);
  const body = updateGenerationBriefSchema.parse(request.body);

  const existing = await prisma.generationBrief.findUnique({
    where: { id: briefId },
  });

  if (!existing) {
    reply.code(404);
    return { message: "Generation brief not found" };
  }

  const brief = await prisma.generationBrief.update({
    where: { id: briefId },
    data: {
      sceneRecipeId: body.sceneRecipeId === undefined ? existing.sceneRecipeId : body.sceneRecipeId || null,
      title: body.title || existing.title,
      generationMode: body.generationMode || existing.generationMode,
      objective: body.objective === undefined ? existing.objective : body.objective || null,
      outputType: body.outputType || existing.outputType,
      aspectRatio: body.aspectRatio || existing.aspectRatio,
      status: body.status || existing.status,
      variationCount: body.variationCount ?? existing.variationCount,
      promptDirection:
        body.promptDirection === undefined ? existing.promptDirection : body.promptDirection || null,
      subjectDirection:
        body.subjectDirection === undefined ? existing.subjectDirection : body.subjectDirection || null,
      remixInstruction:
        body.remixInstruction === undefined ? existing.remixInstruction : body.remixInstruction || null,
      selectedReferenceIdsJson:
        body.selectedReferenceIdsJson === undefined
          ? existing.selectedReferenceIdsJson
          : body.selectedReferenceIdsJson || null,
      selectedAssetIdsJson:
        body.selectedAssetIdsJson === undefined ? existing.selectedAssetIdsJson : body.selectedAssetIdsJson || null,
      keepElementsJson: body.keepElementsJson === undefined ? existing.keepElementsJson : body.keepElementsJson || null,
    },
    include: {
      sceneRecipe: true,
    },
  });

  return brief;
});

app.get("/api/businesses/:businessId/autopilot", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  await ensureDemoVisualWorld(businessId);
  await ensureDemoAutopilot(businessId);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      category: true,
      primaryGoal: true,
      publishMode: true,
      settings: true,
      autopilotPolicy: true,
      autopilotPlans: {
        orderBy: { scheduledFor: "asc" },
        include: {
          sceneRecipe: true,
        },
      },
      ...includeVisualWorldProfile,
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  return business;
});

app.patch("/api/businesses/:businessId/autopilot-policy", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = updateAutopilotPolicySchema.parse(request.body);

  const policy = await prisma.autopilotPolicy.upsert({
    where: { businessId },
    create: {
      businessId,
      status: body.status || "ACTIVE",
      planningMode: body.planningMode || "FULL_AUTO",
      approvalMode: body.approvalMode || "SMART",
      publishEnabled: body.publishEnabled ?? true,
      allowAutoVisualGeneration: body.allowAutoVisualGeneration ?? true,
      allowAutoPublishing: body.allowAutoPublishing ?? false,
      weeklyCadenceJson: body.weeklyCadenceJson || null,
      preferredTimeWindowsJson: body.preferredTimeWindowsJson || null,
      agendaSensitivityJson: body.agendaSensitivityJson || null,
      seasonalPriorityJson: body.seasonalPriorityJson || null,
      contentMixJson: body.contentMixJson || null,
      generationGuardrailsJson: body.generationGuardrailsJson || null,
    },
    update: {
      status: body.status || undefined,
      planningMode: body.planningMode || undefined,
      approvalMode: body.approvalMode || undefined,
      publishEnabled: body.publishEnabled ?? undefined,
      allowAutoVisualGeneration: body.allowAutoVisualGeneration ?? undefined,
      allowAutoPublishing: body.allowAutoPublishing ?? undefined,
      weeklyCadenceJson: body.weeklyCadenceJson === undefined ? undefined : body.weeklyCadenceJson || null,
      preferredTimeWindowsJson:
        body.preferredTimeWindowsJson === undefined ? undefined : body.preferredTimeWindowsJson || null,
      agendaSensitivityJson:
        body.agendaSensitivityJson === undefined ? undefined : body.agendaSensitivityJson || null,
      seasonalPriorityJson:
        body.seasonalPriorityJson === undefined ? undefined : body.seasonalPriorityJson || null,
      contentMixJson: body.contentMixJson === undefined ? undefined : body.contentMixJson || null,
      generationGuardrailsJson:
        body.generationGuardrailsJson === undefined ? undefined : body.generationGuardrailsJson || null,
    },
  });

  return policy;
});

app.post("/api/businesses/:businessId/autopilot/regenerate-week", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      settings: true,
      visualWorldProfile: {
        include: {
          sceneRecipes: {
            where: { active: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      autopilotPolicy: true,
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  const regenerated = await regenerateAutopilotWeek(businessId);

  reply.code(201);
  return {
    ok: true,
    generatedCount: regenerated?.generatedCount || 0,
  };
});

app.get("/api/businesses/:businessId/generation-pipeline", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  await ensureDemoVisualWorld(businessId);
  await ensureDemoGenerationBriefs(businessId);
  await ensureDemoAutopilot(businessId);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      category: true,
      publishMode: true,
      autopilotPolicy: true,
      generationJobs: {
        orderBy: [{ queuedFor: "asc" }, { createdAt: "desc" }],
        include: {
          autopilotPlan: true,
          generationBrief: true,
          contentItem: {
            include: {
              assets: {
                include: {
                  asset: true,
                },
              },
            },
          },
        },
      },
      generationBriefs: {
        orderBy: { updatedAt: "desc" },
        include: {
          sceneRecipe: true,
        },
      },
      autopilotPlans: {
        orderBy: { scheduledFor: "asc" },
        include: {
          sceneRecipe: true,
        },
      },
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  return business;
});

app.get("/api/businesses/:businessId/publishing-center", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  await ensureDemoIntegrationAccount(businessId);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      publishMode: true,
      integrationAccounts: {
        orderBy: { createdAt: "desc" },
      },
      contentItems: {
        where: {
          status: { in: ["APPROVED", "SCHEDULED", "PUBLISHED"] },
        },
        orderBy: [{ plannedFor: "asc" }, { createdAt: "desc" }],
        include: includeContentLibrary,
      },
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  const publishJobs = await prisma.publishJob.findMany({
    where: {
      contentItem: {
        businessId,
      },
    },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }],
    include: {
      integrationAccount: true,
      attempts: {
        orderBy: { attemptedAt: "desc" },
      },
      contentItem: {
        include: {
          ...includeContentLibrary,
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  const externalPosts = await prisma.externalPost.findMany({
    where: {
      contentItem: {
        businessId,
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  const publishJobsWithPreview = await Promise.all(
    publishJobs.map(async (job) => {
      const readiness = await ensurePublishReady(job.contentItemId);
      const payloadPreview = readiness.ok
        ? buildMetaPublishPayload({
            contentItem: job.contentItem,
            selectedOutput: readiness.selectedOutput,
            integrationMetadata: parseIntegrationMetadata(job.integrationAccount.metadataJson),
          })
        : null;

      return {
        ...job,
        connectorMode: String(parseIntegrationMetadata(job.integrationAccount.metadataJson).mode || "SIMULATED"),
        payloadPreview,
      };
    }),
  );

  return {
    ...business,
    publishJobs: publishJobsWithPreview,
    externalPosts,
  };
});

app.get("/api/businesses/:businessId/integrations/instagram", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const integration = await ensureDemoIntegrationAccount(businessId);

  return {
    ...integration,
    metadata: parseIntegrationMetadata(integration.metadataJson),
    envReady: {
      metaAppId: Boolean(process.env.META_APP_ID),
      metaAppSecret: Boolean(process.env.META_APP_SECRET),
      metaRedirectUri: Boolean(process.env.META_REDIRECT_URI),
      publicAssetBaseUrl: Boolean(process.env.PUBLIC_ASSET_BASE_URL),
    },
    tokenReady: Boolean(parseIntegrationMetadata(integration.metadataJson).accessToken),
    tokenPreview: maskToken(String(parseIntegrationMetadata(integration.metadataJson).accessToken || "")),
  };
});

app.get("/api/businesses/:businessId/integrations/instagram/oauth/start", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const config = getMetaConfig();

  if (!config.appId || !config.redirectUri) {
    reply.code(400);
    return { message: "META_APP_ID and META_REDIRECT_URI are required for Meta OAuth." };
  }

  const integration = await ensureDemoIntegrationAccount(businessId);
  const metadata = parseIntegrationMetadata(integration.metadataJson);
  const state = `${businessId}:${randomUUID()}`;

  await prisma.integrationAccount.update({
    where: { id: integration.id },
    data: {
      metadataJson: JSON.stringify({
        ...metadata,
        oauthState: state,
        oauthStartedAt: new Date().toISOString(),
      }),
    },
  });

  const authUrl = new URL(`https://www.facebook.com/${config.apiVersion}/dialog/oauth`);
  authUrl.searchParams.set("client_id", config.appId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", config.oauthScopes);
  authUrl.searchParams.set("response_type", "code");

  return {
    ok: true,
    authUrl: authUrl.toString(),
    state,
  };
});

app.get("/api/meta/oauth/callback", async (request, reply) => {
  const query = metaOAuthCallbackQuerySchema.parse(request.query);

  if (query.error) {
    reply.code(400);
    return {
      ok: false,
      message: query.error_description || query.error_reason || query.error,
    };
  }

  if (!query.code || !query.state) {
    reply.code(400);
    return {
      ok: false,
      message: "code and state are required.",
    };
  }

  const businessIdFromState = query.state.split(":")[0];
  const businessId = query.business_id || businessIdFromState;

  if (!businessId) {
    reply.code(400);
    return {
      ok: false,
      message: "Business id could not be resolved from OAuth state.",
    };
  }

  const config = getMetaConfig();

  if (!config.appId || !config.appSecret || !config.redirectUri) {
    reply.code(400);
    return {
      ok: false,
      message: "META_APP_ID, META_APP_SECRET and META_REDIRECT_URI are required.",
    };
  }

  const integration = await ensureDemoIntegrationAccount(businessId);
  const metadata = parseIntegrationMetadata(integration.metadataJson);

  if (metadata.oauthState !== query.state) {
    reply.code(400);
    return {
      ok: false,
      message: "Invalid OAuth state.",
    };
  }

  const tokenUrl = new URL(`https://graph.facebook.com/${config.apiVersion}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", config.appId);
  tokenUrl.searchParams.set("client_secret", config.appSecret);
  tokenUrl.searchParams.set("redirect_uri", config.redirectUri);
  tokenUrl.searchParams.set("code", query.code);

  const tokenResponse = await fetch(tokenUrl.toString());
  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: {
      message?: string;
    };
  };

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    reply.code(400);
    return {
      ok: false,
      message: tokenPayload.error?.message || "Meta token exchange failed.",
    };
  }

  const expiresAt = tokenPayload.expires_in
    ? new Date(Date.now() + tokenPayload.expires_in * 1000).toISOString()
    : null;

  const updated = await prisma.integrationAccount.update({
    where: { id: integration.id },
    data: {
      status: "CONNECTED",
      metadataJson: JSON.stringify({
        ...metadata,
        accessToken: tokenPayload.access_token,
        tokenType: tokenPayload.token_type || "bearer",
        tokenExpiresAt: expiresAt,
        oauthCompletedAt: new Date().toISOString(),
        oauthState: null,
      }),
    },
  });

  return {
    ok: true,
    integrationId: updated.id,
    tokenReady: true,
    tokenPreview: maskToken(tokenPayload.access_token),
    expiresAt,
  };
});

app.patch("/api/businesses/:businessId/integrations/instagram", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = updateInstagramIntegrationSchema.parse(request.body);
  const current = await ensureDemoIntegrationAccount(businessId);
  const currentMetadata = parseIntegrationMetadata(current.metadataJson);

  const integration = await prisma.integrationAccount.update({
    where: { id: current.id },
    data: {
      accountName: body.accountName,
      externalAccountId: body.externalAccountId || null,
      status: body.status,
      metadataJson: JSON.stringify({
        ...currentMetadata,
        mode: body.connectorMode,
        username: body.username || "",
        pageId: body.pageId || "",
        igBusinessId: body.igBusinessId || "",
        notes: body.notes || "",
      }),
    },
  });

  return {
    ...integration,
    metadata: parseIntegrationMetadata(integration.metadataJson),
  };
});

app.post("/api/businesses/:businessId/publish-jobs/materialize-ready", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = materializePublishJobsSchema.parse(request.body || {});

  const result = await materializePublishJobs(businessId, body.limit);

  reply.code(201);
  return {
    ok: true,
    createdCount: result.createdJobIds.length,
    jobIds: result.createdJobIds,
  };
});

app.post("/api/businesses/:businessId/publish-jobs/run-due", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = runDuePublishJobsSchema.parse(request.body || {});

  const result = await runDuePublishJobs(businessId, body.limit);

  reply.code(201);
  return {
    ok: true,
    publishedCount: result.publishedJobIds.length,
    jobIds: result.publishedJobIds,
  };
});

app.post("/api/businesses/:businessId/generation-jobs/materialize-autopilot", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = materializeAutopilotSchema.parse(request.body || {});

  const result = await materializeAutopilotPlans(businessId, body.limit);

  if (!result) {
    reply.code(404);
    return { message: "Business not found" };
  }

  reply.code(201);
  return {
    ok: true,
    createdCount: result.createdJobIds.length,
    jobIds: result.createdJobIds,
  };
});

app.post("/api/businesses/:businessId/generation-jobs/run-queued", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = runQueuedJobsSchema.parse(request.body || {});

  const result = await runQueuedGenerationJobs(businessId, body.limit);

  if (!result) {
    reply.code(404);
    return { message: "Business not found" };
  }

  reply.code(201);
  return {
    ok: true,
    completedCount: result.completedJobIds.length,
    jobIds: result.completedJobIds,
  };
});

app.get("/api/businesses/:businessId/telegram-status", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      telegramChatLinks: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      telegramCommandRuns: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      assets: {
        where: {
          source: "telegram_upload",
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: includeAssetLibrary,
      },
      generationBriefs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          sceneRecipe: true,
        },
      },
      autopilotPolicy: {
        select: {
          lastPlannedAt: true,
        },
      },
      contentItems: {
        where: { status: "WAITING_APPROVAL" },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          contentItems: true,
        },
      },
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  const latestLink = business.telegramChatLinks[0] || null;
  const latestWaitingItem = business.contentItems[0] || null;
  const latestApproval = latestWaitingItem
    ? await prisma.approvalRequest.findFirst({
        where: {
          contentItemId: latestWaitingItem.id,
          status: { in: ["PENDING", "SENT"] },
        },
        orderBy: { requestedAt: "desc" },
      })
    : null;

  const webhook = await fetchTelegramWebhookInfo();
  const bot = await getTelegramBotIdentity();

  return {
    businessId: business.id,
    businessName: business.name,
    botConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    bot: {
      username: bot.username,
      displayName: bot.displayName,
      connectUrl: buildTelegramConnectUrl(bot.username, business.id),
      ready: bot.ready,
      message: bot.message,
    },
    webhook,
    link: latestLink,
    pendingApprovalCount: await prisma.approvalRequest.count({
      where: {
        contentItem: { businessId },
        status: { in: ["PENDING", "SENT"] },
      },
    }),
    recentTelegramResponses: business.telegramCommandRuns.map((run) => {
      const parsedResult = parseJsonObject(run.resultJson);
      return {
        id: run.id,
        source: run.source,
        commandText: run.commandText,
        intent: run.intent,
        actionType: run.actionType,
        status: run.status,
        responseText: String(parsedResult.responseText || run.summary || "Talep alindi."),
        createdAt: run.createdAt,
      };
    }),
    recentMediaUpdates: business.assets,
    recentGenerationBriefs: business.generationBriefs,
    autopilotLastPlannedAt: business.autopilotPolicy?.lastPlannedAt || null,
    preview: latestWaitingItem
      ? buildTelegramPreview({
          approvalRequestId: latestApproval?.id,
          businessName: business.name,
          contentTitle: latestWaitingItem.title,
          type: latestWaitingItem.type,
          plannedFor: latestWaitingItem.plannedFor,
          targetAction: latestWaitingItem.targetAction,
        })
      : null,
  };
});

app.post("/api/businesses/:businessId/telegram-link", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = telegramLinkSchema.parse(request.body);

  const link = await upsertTelegramChatLink({
    businessId,
    chatId: body.chatId,
    chatTitle: body.chatTitle || null,
  });

  reply.code(201);
  return link;
});

app.post("/api/telegram/webhook/sync", async (_request, reply) => {
  try {
    const result = await syncTelegramWebhook();
    reply.code(201);
    return result;
  } catch (error) {
    reply.code(400);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Telegram webhook could not be synced.",
    };
  }
});

app.get("/api/businesses/:businessId/telegram-command-center", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      operatingMode: true,
      dashboardAccessEnabled: true,
      telegramControlEnabled: true,
      publishMode: true,
      autopilotPolicy: true,
      telegramChatLinks: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      telegramCommandRuns: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  return {
    ...business,
    presets: telegramCommandPresets,
    presetInterpretations: telegramCommandPresets.map((preset) => ({
      command: preset,
      interpretation: interpretTelegramCommand(preset),
    })),
  };
});

app.post("/api/businesses/:businessId/telegram-command-center/interpret", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);
  const body = telegramCommandApplySchema.parse(request.body);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      operatingMode: true,
      publishMode: true,
      telegramControlEnabled: true,
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  if (!business.telegramControlEnabled) {
    reply.code(400);
    return { message: "Telegram control is disabled for this business." };
  }

  const applied = await applyTelegramCommand({
    businessId,
    command: body.command,
    source: body.source,
  });

  return {
    ok: true,
    businessId,
    businessName: business.name,
    operatingMode: business.operatingMode,
    publishMode: applied.application.publishMode,
    command: body.command,
    interpretation: applied.interpretation,
    application: applied.application,
  };
});

app.post("/api/assets", async (request, reply) => {
  const body = createAssetSchema.parse(request.body);

  const asset = await prisma.asset.create({
    data: {
      businessId: body.businessId,
      fileName: body.fileName,
      storageKey: body.storageKey,
      mimeType: body.mimeType,
      mediaType: body.mediaType,
      source: body.source || "operator_upload",
      qualityScore: body.qualityScore ?? null,
      tags: {
        create: body.tags
          .map((tag) => tag.trim())
          .filter(Boolean)
          .map((tag) => ({ tag })),
      },
    },
    include: includeAssetLibrary,
  });

  reply.code(201);
  return asset;
});

app.patch("/api/assets/:assetId", async (request, reply) => {
  const paramsSchema = z.object({
    assetId: z.string().uuid(),
  });

  const { assetId } = paramsSchema.parse(request.params);
  const body = updateAssetSchema.parse(request.body);

  const currentAsset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, businessId: true },
  });

  if (!currentAsset) {
    reply.code(404);
    return { message: "Asset not found" };
  }

  await prisma.$transaction(async (tx) => {
    if (body.isFeatured) {
      await tx.asset.updateMany({
        where: {
          businessId: currentAsset.businessId,
          NOT: { id: assetId },
        },
        data: { isFeatured: false },
      });
    }

    await tx.assetTag.deleteMany({
      where: { assetId },
    });

    await tx.asset.update({
      where: { id: assetId },
      data: {
        fileName: body.fileName,
        storageKey: body.storageKey,
        mimeType: body.mimeType,
        mediaType: body.mediaType,
        source: body.source || "operator_upload",
        qualityScore: body.qualityScore ?? null,
        isFeatured: body.isFeatured,
        tags: {
          create: body.tags
            .map((tag) => tag.trim())
            .filter(Boolean)
            .map((tag) => ({ tag })),
        },
      },
    });
  });

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: includeAssetLibrary,
  });

  return asset;
});

app.get("/api/businesses/:businessId/content-items", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      contentPillars: {
        where: { active: true },
        orderBy: { priority: "asc" },
      },
      contentItems: {
        orderBy: [{ plannedFor: "asc" }, { createdAt: "desc" }],
        include: includeContentLibrary,
      },
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  return business;
});

app.post("/api/content-items", async (request, reply) => {
  const body = createContentItemSchema.parse(request.body);

  const contentItem = await prisma.contentItem.create({
    data: {
      businessId: body.businessId,
      title: body.title,
      type: body.type,
      status: body.status,
      pillarName: body.pillarName || null,
      targetAction: body.targetAction || null,
      plannedFor: body.plannedFor ? new Date(body.plannedFor) : null,
      approvalRequired: body.approvalRequired,
      needsClientApproval: body.needsClientApproval,
    },
  });

  reply.code(201);
  return contentItem;
});

app.patch("/api/content-items/:contentItemId", async (request, reply) => {
  const paramsSchema = z.object({
    contentItemId: z.string().uuid(),
  });

  const { contentItemId } = paramsSchema.parse(request.params);
  const body = updateContentItemSchema.parse(request.body);

  if (["APPROVED", "SCHEDULED", "PUBLISHED"].includes(body.status)) {
    const readiness = await ensurePublishReady(contentItemId);

    if (!readiness.ok) {
      reply.code(400);
      return { message: readiness.message };
    }
  }

  const contentItem = await prisma.contentItem.update({
    where: { id: contentItemId },
    data: {
      title: body.title,
      type: body.type,
      status: body.status,
      pillarName: body.pillarName || null,
      targetAction: body.targetAction || null,
      plannedFor: body.plannedFor ? new Date(body.plannedFor) : null,
      approvalRequired: body.approvalRequired,
      needsClientApproval: body.needsClientApproval,
    },
  });

  if (body.status === "SCHEDULED") {
    await ensurePublishJobForContentItem(contentItemId);
  }

  return contentItem;
});

app.post("/api/content-items/:contentItemId/select-output", async (request, reply) => {
  const paramsSchema = z.object({
    contentItemId: z.string().uuid(),
  });

  const { contentItemId } = paramsSchema.parse(request.params);
  const body = selectContentOutputSchema.parse(request.body);

  const existingLink = await prisma.contentItemAsset.findUnique({
    where: { id: body.contentItemAssetId },
    include: {
      contentItem: true,
      asset: true,
    },
  });

  if (!existingLink || existingLink.contentItemId !== contentItemId) {
    reply.code(404);
    return { message: "Content output not found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.contentItemAsset.updateMany({
      where: { contentItemId },
      data: { isSelected: false },
    });

    await tx.contentItemAsset.update({
      where: { id: body.contentItemAssetId },
      data: { isSelected: true },
    });
  });

  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: includeContentLibrary,
  });

  return {
    ok: true,
    contentItem,
    selected: existingLink,
  };
});

app.post("/api/content-items/:contentItemId/send-approval", async (request, reply) => {
  const paramsSchema = z.object({
    contentItemId: z.string().uuid(),
  });

  const { contentItemId } = paramsSchema.parse(request.params);

  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      approvals: {
        where: { status: { in: ["PENDING", "SENT"] } },
      },
      business: {
        include: {
          telegramChatLinks: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!contentItem) {
    reply.code(404);
    return { message: "Content item not found" };
  }

  const readiness = await ensurePublishReady(contentItemId);

  if (!readiness.ok) {
    reply.code(400);
    return { message: readiness.message };
  }

  if (contentItem.approvals.length > 0) {
    return contentItem.approvals[0];
  }

  const approvalRequest = await prisma.$transaction(async (tx) => {
    await tx.contentItem.update({
      where: { id: contentItemId },
      data: { status: "WAITING_APPROVAL" },
    });

    return tx.approvalRequest.create({
      data: {
        contentItemId,
        channel: contentItem.business.telegramChatLinks[0] ? "telegram" : "telegram_simulated",
        status: "SENT",
      },
      include: {
        contentItem: true,
        actions: true,
      },
    });
  });

  reply.code(201);
  return {
    approvalRequest,
    telegramPreview: buildTelegramPreview({
      approvalRequestId: approvalRequest.id,
      businessName: contentItem.business.name,
      contentTitle: contentItem.title,
      type: contentItem.type,
      plannedFor: contentItem.plannedFor,
      targetAction: contentItem.targetAction,
    }),
  };
});

app.get("/api/businesses/:businessId/approval-queue", async (request, reply) => {
  const paramsSchema = z.object({
    businessId: z.string().uuid(),
  });

  const { businessId } = paramsSchema.parse(request.params);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      contentItems: {
        where: {
          approvals: {
            some: {},
          },
        },
        orderBy: { updatedAt: "desc" },
        include: includeContentLibrary,
      },
    },
  });

  if (!business) {
    reply.code(404);
    return { message: "Business not found" };
  }

  return business;
});

app.post("/api/approval-requests/:approvalRequestId/action", async (request, reply) => {
  const paramsSchema = z.object({
    approvalRequestId: z.string().uuid(),
  });

  const { approvalRequestId } = paramsSchema.parse(request.params);
  const body = approvalActionSchema.parse(request.body);

  let result;

  try {
    result = await applyApprovalDecision(approvalRequestId, body.action, body.note);
  } catch (error) {
    reply.code(400);
    return { message: error instanceof Error ? error.message : "Approval could not be completed." };
  }

  if (!result) {
    reply.code(404);
    return { message: "Approval request not found" };
  }

  return result;
});

app.post("/api/telegram/webhook", async (request) => {
  const body = request.body as
    | {
        message?: {
          text?: string;
          caption?: string;
          photo?: Array<{
            file_id?: string;
            width?: number;
            height?: number;
          }>;
          document?: {
            file_id?: string;
            mime_type?: string;
            file_name?: string;
          };
          chat?: {
            id?: number | string;
            title?: string;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
        };
        callback_query?: {
          data?: string;
          message?: {
            chat?: { id?: number | string };
          };
        };
      }
    | undefined;

  const incomingText = body?.message?.text?.trim();
  const incomingCaption = body?.message?.caption?.trim() || "";
  const chatId = String(body?.message?.chat?.id || body?.callback_query?.message?.chat?.id || "");
  const startPayload =
    incomingText?.match(/^\/start(?:@\w+)?\s+(.+)$/)?.[1]?.trim() ||
    incomingText?.match(/^\/start(?:@\w+)?$/)?.[0]?.trim() ||
    "";

  if (chatId) {
    const connectBusinessId =
      startPayload.match(/^connect_([0-9a-f-]{36})$/i)?.[1] ||
      startPayload.match(/^([0-9a-f-]{36})$/i)?.[1] ||
      "";

    if (connectBusinessId) {
      const business = await prisma.business.findUnique({
        where: { id: connectBusinessId },
        select: { id: true, name: true },
      });

      if (business) {
        const link = await upsertTelegramChatLink({
          businessId: business.id,
          chatId,
          chatTitle: buildTelegramChatTitle(body?.message?.chat || {}),
        });

        return {
          ok: true,
          handled: true,
          mode: "AUTO_LINK",
          businessId: business.id,
          chatId,
          linkId: link.id,
          responseText: `${business.name} icin Telegram baglantisi tamamlandi.`,
        };
      }
    }
  }

  if (chatId) {
    const linkedChat = await prisma.telegramChatLink.findFirst({
      where: {
        chatId,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    if (linkedChat) {
      const photoCandidates = body?.message?.photo || [];
      const selectedPhoto = photoCandidates[photoCandidates.length - 1];
      const document = body?.message?.document;

      if (selectedPhoto?.file_id || document?.file_id) {
        try {
          const created = await createTelegramMediaIntake({
            businessId: linkedChat.businessId,
            chatId,
            caption: incomingCaption,
            fileId: String(selectedPhoto?.file_id || document?.file_id || ""),
            mediaType: "IMAGE",
            mimeType: document?.mime_type || "image/jpeg",
            fileName:
              document?.file_name ||
              `telegram-${Date.now()}${document?.mime_type === "image/png" ? ".png" : ".jpg"}`,
          });

          return {
            ok: true,
            handled: true,
            mode: "MEDIA_INTAKE",
            intakeType: created.intakeType,
            assetId: created.asset.id,
            productId: created.productId,
            visualReferenceId: created.visualReferenceId,
            generatedBriefId: created.generatedBriefId,
            replanGeneratedCount: created.replanGeneratedCount,
          };
        } catch {
          return { ok: true, handled: false };
        }
      }

      if (incomingText) {
        try {
          const applied = await applyTelegramCommand({
            businessId: linkedChat.businessId,
            command: incomingText,
            source: "telegram",
          });

          return {
            ok: true,
            handled: true,
            mode: "TEXT_COMMAND",
            interpretation: applied.interpretation.intent,
            status: applied.application.status,
          };
        } catch {
          return { ok: true, handled: false };
        }
      }
    }
  }

  const callbackData = body?.callback_query?.data;

  if (!callbackData) {
    return { ok: true, handled: false };
  }

  const [action, approvalRequestId] = callbackData.split(":");

  if (!approvalRequestId || !["APPROVE", "REVISE", "REJECT"].includes(action.toUpperCase())) {
    return { ok: true, handled: false };
  }

  let result = null;

  try {
    result = await applyApprovalDecision(
      approvalRequestId,
      action.toUpperCase() as "APPROVE" | "REVISE" | "REJECT",
      `telegram callback from chat ${body?.callback_query?.message?.chat?.id ?? "unknown"}`,
    );
  } catch {
    return { ok: true, handled: false };
  }

  return { ok: true, handled: Boolean(result) };
});

const start = async () => {
  try {
    await app.register(cors, {
      origin: true,
      methods: ["GET", "POST", "PATCH", "OPTIONS"],
      credentials: false,
    });

    await ensureDemoWorkspace();
    await app.listen({
      port: Number(process.env.PORT || 4000),
      host: process.env.HOST || "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
