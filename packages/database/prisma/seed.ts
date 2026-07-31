import {
  ConsentPurpose,
  Grind,
  PrismaClient,
  ProductStatus,
  RoastLevel,
} from "@prisma/client";

const prisma = new PrismaClient();

const brands = [
  {
    slug: "la-vita-vivace",
    name: "La Vita Vivace",
    tagline: "Традиции тёмной обжарки",
    description: "Плотный классический кофе с нотами тёмного шоколада и карамели.",
    roastLevel: RoastLevel.DARK,
    audience: "Кофейни и дом",
    origins: ["Бразилия", "Уганда", "Эфиопия"],
    sortOrder: 10,
  },
  {
    slug: "ag-meriggiare",
    name: "AG Meriggiare",
    tagline: "Молодость и вкусовые открытия",
    description: "Современная линейка с фруктовыми, цветочными и чайными дескрипторами.",
    roastLevel: RoastLevel.MEDIUM,
    audience: "Дом и спешелти-кофейни",
    origins: ["Бразилия", "Эфиопия"],
    sortOrder: 20,
  },
  {
    slug: "brand-x",
    name: "Brand X",
    tagline: "Универсальный премиальный кофе",
    description: "Сбалансированная линейка для B2B и B2C, включая decaf.",
    roastLevel: RoastLevel.MEDIUM,
    audience: "B2B и B2C",
    origins: ["Бразилия", "Эфиопия", "Колумбия"],
    sortOrder: 30,
  },
];

const countries = [
  {
    slug: "brazil",
    name: "Бразилия",
    region: "Серрадо и Минас-Жерайс",
    lead: "Сладкий, плотный и понятный профиль для эспрессо и молочных напитков.",
    tasteNotes: ["шоколад", "фундук", "карамель"],
    aroma: ["какао", "орех"],
    altitude: "900–1 300 м",
    processing: "натуральная",
    acidity: 2,
    body: 5,
    roastRecommendation: "Средняя или тёмная",
  },
  {
    slug: "ethiopia",
    name: "Эфиопия",
    region: "Иргачефф и Гуджи",
    lead: "Цветочный и фруктовый кофе с яркой, чистой кислотностью.",
    tasteNotes: ["бергамот", "ягоды", "цитрус"],
    aroma: ["жасмин", "чай"],
    altitude: "1 700–2 200 м",
    processing: "мытая и натуральная",
    acidity: 5,
    body: 3,
    roastRecommendation: "Светлая или средняя",
  },
  {
    slug: "uganda",
    name: "Уганда",
    region: "Сипи-Фолс",
    lead: "Плотный кофе с шоколадом, специями и сухофруктами.",
    tasteNotes: ["тёмный шоколад", "специи", "сухофрукты"],
    aroma: ["какао", "пряности"],
    altitude: "1 300–1 900 м",
    processing: "натуральная",
    acidity: 2,
    body: 5,
    roastRecommendation: "Тёмная",
  },
];

const products = [
  ["brazil-cerrado", "Brazil Cerrado", "la-vita-vivace", ["brazil"], RoastLevel.DARK, false, ["молочный шоколад", "фундук", "карамель"], 79000],
  ["espresso-classico", "Espresso Classico", "la-vita-vivace", ["brazil", "uganda"], RoastLevel.DARK, false, ["тёмный шоколад", "ореховая паста"], 89000],
  ["uganda-sipi-falls", "Uganda Sipi Falls", "la-vita-vivace", ["uganda"], RoastLevel.DARK, false, ["тёмный шоколад", "специи", "сухофрукты"], 89000],
  ["ethiopia-yirgacheffe", "Ethiopia Yirgacheffe", "ag-meriggiare", ["ethiopia"], RoastLevel.MEDIUM, false, ["жасмин", "бергамот", "черника"], 99000],
  ["brazil-fazenda-rio", "Brazil Fazenda Rio", "ag-meriggiare", ["brazil"], RoastLevel.MEDIUM, false, ["карамель", "миндаль", "красное яблоко"], 79000],
  ["ethiopia-guji-natural", "Ethiopia Guji Natural", "ag-meriggiare", ["ethiopia"], RoastLevel.LIGHT, false, ["клубника", "какао", "чёрный чай"], 109000],
  ["house-blend", "House Blend", "brand-x", ["brazil", "ethiopia"], RoastLevel.MEDIUM, false, ["шоколад", "орех", "цитрус"], 85000],
  ["filter-selection", "Filter Selection", "brand-x", ["ethiopia"], RoastLevel.LIGHT, false, ["абрикос", "чёрный чай", "мёд"], 99000],
  ["decaf-colombia-swp", "Decaf Colombia SWP", "brand-x", ["brazil"], RoastLevel.MEDIUM, true, ["какао", "изюм", "мягкая сладость"], 119000],
] as const;

async function main() {
  const brandIds = new Map<string, string>();
  const countryIds = new Map<string, string>();

  for (const data of brands) {
    const brand = await prisma.brand.upsert({ where: { slug: data.slug }, update: data, create: data });
    brandIds.set(data.slug, brand.id);
  }

  for (const data of countries) {
    const country = await prisma.country.upsert({ where: { slug: data.slug }, update: data, create: data });
    countryIds.set(data.slug, country.id);
  }

  for (const [slug, name, brandSlug, countrySlugs, roastLevel, isDecaf, descriptors, price] of products) {
    const product = await prisma.product.upsert({
      where: { slug },
      update: { name, brandId: brandIds.get(brandSlug)!, roastLevel, isDecaf, flavorDescriptors: [...descriptors], status: ProductStatus.ACTIVE, ingredients: "Кофе натуральный жареный молотый, 100% арабика", productionCountry: "Россия", shelfLifeDays: 365, storageConditions: "Хранить в сухом месте при температуре не выше 25 °C", preparation: "Установить дрип-пакет на чашку и пролить 180–200 мл воды температурой 92–96 °C" },
      create: {
        slug,
        name,
        brandId: brandIds.get(brandSlug)!,
        description: `${name}: ${descriptors.join(", ")}.`,
        roastLevel,
        isDecaf,
        flavorDescriptors: [...descriptors],
        status: ProductStatus.ACTIVE,
        ingredients: "Кофе натуральный жареный молотый, 100% арабика",
        productionCountry: "Россия",
        shelfLifeDays: 365,
        storageConditions: "Хранить в сухом месте при температуре не выше 25 °C",
        preparation: "Установить дрип-пакет на чашку и пролить 180–200 мл воды температурой 92–96 °C",
      },
    });

    await prisma.productCountry.deleteMany({ where: { productId: product.id } });
    await prisma.productCountry.createMany({
      data: countrySlugs.map((countrySlug) => ({ productId: product.id, countryId: countryIds.get(countrySlug)! })),
    });

    await prisma.productVariant.updateMany({ where: { productId: product.id }, data: { isActive: false } });
    const weightG = 100;
    await prisma.productVariant.upsert({
      where: { productId_weightG_grind: { productId: product.id, weightG, grind: Grind.FILTER } },
      update: { priceKopecks: price, stockQty: 50, isActive: true },
      create: {
        productId: product.id,
        weightG,
        grind: Grind.FILTER,
        sku: `ALGI-${slug.toUpperCase()}-DRIP10`,
        priceKopecks: price,
        stockQty: 50,
        tnVedCode: "0901",
        okpd2Code: "10.83.11",
        markingRequired: true,
      },
    });
  }

  await prisma.consentDocument.upsert({
    where: { purpose_version: { purpose: ConsentPurpose.LEAD_RESPONSE, version: "draft-2026-07-31" } },
    update: {},
    create: {
      purpose: ConsentPurpose.LEAD_RESPONSE,
      version: "draft-2026-07-31",
      title: "Согласие на обработку персональных данных для ответа на обращение",
      text: "ЧЕРНОВИК: заменить утверждённым юристом текстом до production-запуска.",
      publishedAt: new Date("2026-07-31T00:00:00.000Z"),
      isActive: true,
    },
  });
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
