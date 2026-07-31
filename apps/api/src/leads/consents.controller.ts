import { Controller, Get, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Controller("consents")
export class ConsentsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get("lead-response")
  async leadResponse() {
    const document = await this.prisma.consentDocument.findFirst({
      where: { purpose: "LEAD_RESPONSE", isActive: true },
      orderBy: { publishedAt: "desc" },
      select: { version: true, title: true, publishedAt: true },
    });
    if (!document) throw new NotFoundException("Активное согласие не опубликовано");
    return { ...document, url: "/legal/consent" };
  }
}
