import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../common/prisma.service";

@ApiTags("system")
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("healthz")
  health() {
    return { status: "ok" };
  }

  @Get("readyz")
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ready" };
  }
}
