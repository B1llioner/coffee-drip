import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { Prisma } from "@algi/database";
import { PrismaService } from "../common/prisma.service";
import type { AppEnv } from "../config/env";
import { CreateAdminUserDto, CreateMarkingUnitDto, CreatePromotionDto, CreateRoastBatchDto, UpdateAdminUserDto, UpdateMarkingStatusDto, UpdatePrivacyRequestDto, UpdatePromotionDto, UpdateSettingDto } from "./admin-operations.dto";
import { AdminAuthGuard, type AdminRequest } from "./auth/admin-auth.guard";
import { AdminRoles } from "./auth/admin-roles.decorator";
import { hashPassword } from "./auth/password";

@Controller("admin/operations")
@UseGuards(AdminAuthGuard)
export class AdminOperationsController {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService<AppEnv, true>) {}

  @Get("audit") @AdminRoles("ADMIN")
  audit() { return this.prisma.auditLog.findMany({ include: { actor: { select: { displayName: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 300 }); }

  @Get("users") @AdminRoles("ADMIN")
  users() { return this.prisma.user.findMany({ select: { id: true, email: true, displayName: true, role: true, isActive: true, createdAt: true }, orderBy: { createdAt: "asc" } }); }

  @Post("users") @AdminRoles("ADMIN")
  async createUser(@Body() dto: CreateAdminUserDto, @Req() request: AdminRequest) {
    const user = await this.prisma.user.create({ data: { email: dto.email.trim().toLowerCase(), passwordHash: await hashPassword(dto.password), displayName: dto.displayName, role: dto.role } });
    await this.log(request.adminUser!.id, "user.create", "user", user.id, { email: user.email, role: user.role });
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, isActive: user.isActive };
  }

  @Patch("users/:id") @AdminRoles("ADMIN")
  async updateUser(@Param("id") id: string, @Body() dto: UpdateAdminUserDto, @Req() request: AdminRequest) {
    if (id === request.adminUser!.id && dto.isActive === false) throw new BadRequestException("Нельзя отключить собственную учётную запись");
    const { password, ...data } = dto;
    const user = await this.prisma.user.update({ where: { id }, data: { ...data, ...(password ? { passwordHash: await hashPassword(password) } : {}) } });
    if (password || dto.isActive === false) await this.prisma.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.log(request.adminUser!.id, "user.update", "user", id, { ...data, passwordChanged: Boolean(password) });
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, isActive: user.isActive };
  }

  @Get("settings") @AdminRoles("ADMIN", "MANAGER")
  settings() { return this.prisma.setting.findMany({ orderBy: { key: "asc" } }); }

  @Patch("settings/:key") @AdminRoles("ADMIN")
  async setting(@Param("key") key: string, @Body() dto: UpdateSettingDto, @Req() request: AdminRequest) {
    if (!/^[a-z][a-z0-9_.-]{1,80}$/.test(key)) throw new BadRequestException("Некорректный ключ настройки");
    const value = dto.value as Prisma.InputJsonValue;
    const result = await this.prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    await this.log(request.adminUser!.id, "setting.update", "setting", key, { key });
    return result;
  }

  @Get("roast-batches") @AdminRoles("ADMIN", "WAREHOUSE")
  batches() { return this.prisma.roastBatch.findMany({ include: { product: { select: { name: true, slug: true } } }, orderBy: { roastedAt: "desc" }, take: 300 }); }

  @Post("roast-batches") @AdminRoles("ADMIN", "WAREHOUSE")
  async batch(@Body() dto: CreateRoastBatchDto, @Req() request: AdminRequest) {
    const batch = await this.prisma.roastBatch.create({ data: { ...dto, roastedAt: new Date(dto.roastedAt) } });
    await this.log(request.adminUser!.id, "roast_batch.create", "roast_batch", batch.id, { productId: dto.productId, weightKg: dto.weightKg });
    return batch;
  }

  @Get("marking") @AdminRoles("ADMIN", "WAREHOUSE")
  marking() { return this.prisma.markingUnit.findMany({ select: { id: true, variantId: true, codeHash: true, status: true, batchRef: true, introducedAt: true, withdrawnAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 }); }

  @Post("marking") @AdminRoles("ADMIN", "WAREHOUSE")
  async addMarking(@Body() dto: CreateMarkingUnitDto, @Req() request: AdminRequest) {
    const keyHex = this.config.get("MARKING_ENCRYPTION_KEY", { infer: true });
    if (!keyHex) throw new BadRequestException("MARKING_ENCRYPTION_KEY не настроен");
    const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
    const encrypted = Buffer.concat([cipher.update(dto.code, "utf8"), cipher.final()]); const tag = cipher.getAuthTag();
    const unit = await this.prisma.markingUnit.create({ data: { variantId: dto.variantId, codeHash: createHash("sha256").update(dto.code).digest("hex"), encryptedCode: Buffer.concat([iv, tag, encrypted]), status: "RECEIVED", batchRef: dto.batchRef } });
    await this.log(request.adminUser!.id, "marking.create", "marking_unit", unit.id, { variantId: dto.variantId, codeHash: unit.codeHash });
    return { id: unit.id, codeHash: unit.codeHash, status: unit.status };
  }

  @Patch("marking/:id") @AdminRoles("ADMIN", "WAREHOUSE")
  async updateMarking(@Param("id") id: string, @Body() dto: UpdateMarkingStatusDto, @Req() request: AdminRequest) {
    const unit = await this.prisma.markingUnit.update({ where: { id }, data: { status: dto.status, ...(dto.status === "INTRODUCED" ? { introducedAt: new Date() } : {}), ...(dto.status === "WITHDRAWN" ? { withdrawnAt: new Date(), withdrawalRef: dto.reference } : {}) } });
    await this.log(request.adminUser!.id, "marking.status.update", "marking_unit", id, { status: dto.status, reference: dto.reference });
    return { id: unit.id, codeHash: unit.codeHash, status: unit.status };
  }

  @Get("privacy-requests") @AdminRoles("ADMIN", "MANAGER")
  privacyRequests() { return this.prisma.privacyRequest.findMany({ orderBy: { createdAt: "desc" }, take: 300 }); }

  @Patch("privacy-requests/:id") @AdminRoles("ADMIN", "MANAGER")
  async privacyRequest(@Param("id") id: string, @Body() dto: UpdatePrivacyRequestDto, @Req() request: AdminRequest) {
    const item = await this.prisma.privacyRequest.update({ where: { id }, data: { status: dto.status, resolvedAt: ["COMPLETED", "REJECTED"].includes(dto.status) ? new Date() : null } });
    await this.log(request.adminUser!.id, "privacy_request.update", "privacy_request", id, { status: dto.status });
    return item;
  }

  @Get("promotions") @AdminRoles("ADMIN", "MANAGER")
  promotions() { return this.prisma.promotion.findMany({ orderBy: { createdAt: "desc" } }); }

  @Post("promotions") @AdminRoles("ADMIN", "MANAGER")
  async createPromotion(@Body() dto: CreatePromotionDto, @Req() request: AdminRequest) {
    if (dto.discountType === "PERCENT" && dto.discountValue > 100) throw new BadRequestException("Процент скидки не может превышать 100");
    const promotion = await this.prisma.promotion.create({ data: { ...dto, code: dto.code.trim().toUpperCase(), startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined } });
    await this.log(request.adminUser!.id, "promotion.create", "promotion", promotion.id, { code: promotion.code }); return promotion;
  }

  @Patch("promotions/:id") @AdminRoles("ADMIN", "MANAGER")
  async updatePromotion(@Param("id") id: string, @Body() dto: UpdatePromotionDto, @Req() request: AdminRequest) {
    if (dto.discountType === "PERCENT" && dto.discountValue && dto.discountValue > 100) throw new BadRequestException("Процент скидки не может превышать 100");
    const promotion = await this.prisma.promotion.update({ where: { id }, data: { ...dto, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined } });
    await this.log(request.adminUser!.id, "promotion.update", "promotion", id, { ...dto }); return promotion;
  }

  private log(actorId: string, action: string, entityType: string, entityId: string, changes: object) { return this.prisma.auditLog.create({ data: { actorId, action, entityType, entityId, changes } }); }
}
