import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../common/prisma.service";
import { AdminAuthGuard, type AdminRequest } from "./auth/admin-auth.guard";
import { AdminRoles } from "./auth/admin-roles.decorator";
import { CreateAdminProductDto, CreateAdminVariantDto, UpdateAdminProductDto, UpdateAdminVariantDto } from "./admin-products.dto";

@ApiTags("admin-products")
@Controller("admin/products")
@UseGuards(AdminAuthGuard)
export class AdminProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.product.findMany({
      where: { deletedAt: null },
      include: { brand: true, countries: { include: { country: true } }, variants: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  @Post()
  @AdminRoles("ADMIN", "CONTENT_MANAGER")
  async create(@Body() dto: CreateAdminProductDto, @Req() request: AdminRequest) {
    const product = await this.prisma.product.create({ data: dto });
    await this.audit(request.adminUser!.id, "product.create", product.id, dto);
    return product;
  }

  @Patch(":id")
  @AdminRoles("ADMIN", "CONTENT_MANAGER")
  async update(@Param("id") id: string, @Body() dto: UpdateAdminProductDto, @Req() request: AdminRequest) {
    const product = await this.prisma.product.update({ where: { id }, data: dto });
    await this.audit(request.adminUser!.id, "product.update", id, dto);
    return product;
  }

  @Delete(":id")
  @AdminRoles("ADMIN")
  async archive(@Param("id") id: string, @Req() request: AdminRequest) {
    const product = await this.prisma.product.update({
      where: { id },
      data: { status: "ARCHIVED", deletedAt: new Date() },
    });
    await this.audit(request.adminUser!.id, "product.archive", id, { status: "ARCHIVED" });
    return product;
  }

  @Post(":id/variants")
  @AdminRoles("ADMIN", "CONTENT_MANAGER", "WAREHOUSE")
  async createVariant(@Param("id") productId: string, @Body() dto: CreateAdminVariantDto, @Req() request: AdminRequest) {
    const variant = await this.prisma.productVariant.create({ data: { ...dto, productId } });
    await this.audit(request.adminUser!.id, "variant.create", variant.id, { ...dto, productId });
    return variant;
  }

  @Patch("variants/:variantId")
  @AdminRoles("ADMIN", "CONTENT_MANAGER", "WAREHOUSE")
  async updateVariant(@Param("variantId") id: string, @Body() dto: UpdateAdminVariantDto, @Req() request: AdminRequest) {
    const variant = await this.prisma.productVariant.update({ where: { id }, data: dto });
    await this.audit(request.adminUser!.id, "variant.update", id, dto);
    return variant;
  }

  private audit(actorId: string, action: string, entityId: string, changes: object) {
    return this.prisma.auditLog.create({ data: { actorId, action, entityType: "product", entityId, changes } });
  }
}
