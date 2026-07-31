import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../common/prisma.service";
import { CreateAdminLeadNoteDto, UpdateAdminLeadDto } from "./admin-leads.dto";
import { AdminAuthGuard, type AdminRequest } from "./auth/admin-auth.guard";
import { AdminRoles } from "./auth/admin-roles.decorator";

@ApiTags("admin-leads")
@Controller("admin/leads")
@UseGuards(AdminAuthGuard)
@AdminRoles("ADMIN", "MANAGER")
export class AdminLeadsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.lead.findMany({
      where: { deletedAt: null },
      include: { assignedTo: { select: { id: true, displayName: true } }, notifications: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.prisma.lead.findUniqueOrThrow({
      where: { id },
      include: {
        assignedTo: { select: { id: true, displayName: true } },
        notifications: true,
        consents: { include: { document: true } },
        notes: { include: { author: { select: { id: true, displayName: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateAdminLeadDto, @Req() request: AdminRequest) {
    const data = { ...dto, nextActionAt: dto.nextActionAt ? new Date(dto.nextActionAt) : undefined };
    const lead = await this.prisma.lead.update({ where: { id }, data });
    await this.prisma.auditLog.create({
      data: { actorId: request.adminUser!.id, action: "lead.update", entityType: "lead", entityId: id, changes: { ...dto } },
    });
    return lead;
  }

  @Post(":id/notes")
  async note(@Param("id") leadId: string, @Body() dto: CreateAdminLeadNoteDto, @Req() request: AdminRequest) {
    const note = await this.prisma.leadNote.create({
      data: { leadId, authorId: request.adminUser!.id, body: dto.body },
    });
    await this.prisma.auditLog.create({
      data: { actorId: request.adminUser!.id, action: "lead.note.create", entityType: "lead", entityId: leadId },
    });
    return note;
  }
}
