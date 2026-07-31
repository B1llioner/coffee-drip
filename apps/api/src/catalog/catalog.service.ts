import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ProductStatus } from "@algi/database";
import { PrismaService } from "../common/prisma.service";
import { CatalogQueryDto, CatalogSort } from "./catalog.dto";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: CatalogQueryDto) {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      deletedAt: null,
      ...(query.brand ? { brand: { slug: query.brand, isActive: true } } : {}),
      ...(query.country ? { countries: { some: { country: { slug: query.country } } } } : {}),
      ...(query.roast ? { roastLevel: query.roast } : {}),
      ...(query.decaf !== undefined ? { isDecaf: query.decaf } : {}),
    };
    const variantDirection: Prisma.SortOrder = query.sort === CatalogSort.PRICE_DESC ? "desc" : "asc";
    const orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] =
      query.sort === CatalogSort.NEW ? { createdAt: "desc" } : [{ sortOrder: "asc" }, { name: "asc" }];
    const rows = await this.prisma.product.findMany({
      where,
      include: {
        brand: { select: { slug: true, name: true } },
        countries: { include: { country: { select: { slug: true, name: true } } } },
        variants: { where: { isActive: true }, orderBy: { priceKopecks: variantDirection } },
      },
      orderBy,
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    if (query.sort === CatalogSort.PRICE_ASC || query.sort === CatalogSort.PRICE_DESC) {
      rows.sort((a, b) => {
        const first = a.variants[0]?.priceKopecks ?? Number.MAX_SAFE_INTEGER;
        const second = b.variants[0]?.priceKopecks ?? Number.MAX_SAFE_INTEGER;
        return query.sort === CatalogSort.PRICE_ASC ? first - second : second - first;
      });
    }
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    const [brands, countries, roasts] = await Promise.all([
      this.prisma.brand.findMany({ where: { isActive: true, deletedAt: null }, select: { slug: true, name: true, _count: { select: { products: true } } } }),
      this.prisma.country.findMany({ select: { slug: true, name: true, _count: { select: { products: true } } } }),
      this.prisma.product.groupBy({ by: ["roastLevel"], where: { status: ProductStatus.ACTIVE, deletedAt: null }, _count: true }),
    ]);
    return {
      items: items.map((product) => ({
        ...product,
        countries: product.countries.map(({ country }) => country),
        variants: product.variants.map((variant) => ({ ...variant, price: variant.priceKopecks / 100 })),
      })),
      pageInfo: { hasMore, nextCursor: hasMore ? items.at(-1)?.id : null },
      facets: {
        brands: brands.map(({ _count, ...brand }) => ({ ...brand, count: _count.products })),
        countries: countries.map(({ _count, ...country }) => ({ ...country, count: _count.products })),
        roasts: roasts.map((roast) => ({ value: roast.roastLevel, count: roast._count })),
      },
    };
  }

  async bySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.ACTIVE, deletedAt: null },
      include: { brand: true, countries: { include: { country: true } }, variants: { where: { isActive: true } } },
    });
    if (!product) throw new NotFoundException("Товар не найден");
    return product;
  }

  async brands() {
    const rows = await this.prisma.brand.findMany({
      where: { isActive: true, deletedAt: null },
      include: { _count: { select: { products: { where: { status: ProductStatus.ACTIVE, deletedAt: null } } } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map(({ _count, ...brand }) => ({ ...brand, productCount: _count.products }));
  }

  async countries() {
    const rows = await this.prisma.country.findMany({
      include: { _count: { select: { products: { where: { product: { status: ProductStatus.ACTIVE, deletedAt: null } } } } } },
      orderBy: { name: "asc" },
    });
    return rows.map(({ _count, ...country }) => ({ ...country, productCount: _count.products }));
  }
}
