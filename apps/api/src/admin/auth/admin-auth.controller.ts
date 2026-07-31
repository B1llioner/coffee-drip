import { Body, Controller, Get, Headers, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { FastifyReply } from "fastify";
import { AdminLoginDto } from "./admin-auth.dto";
import { AdminAuthGuard, type AdminRequest } from "./admin-auth.guard";
import { AdminAuthService } from "./admin-auth.service";

@ApiTags("admin-auth")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: AdminLoginDto, @Headers("origin") origin: string | undefined, @Res({ passthrough: true }) reply: FastifyReply) {
    this.auth.assertOrigin(origin);
    const result = await this.auth.login(dto.email, dto.password);
    reply.header("Set-Cookie", this.auth.cookie(result.token, result.expiresAt));
    return { user: result.user, expiresAt: result.expiresAt };
  }

  @Get("me")
  @UseGuards(AdminAuthGuard)
  me(@Req() request: AdminRequest) {
    return request.adminUser;
  }

  @Post("logout")
  @UseGuards(AdminAuthGuard)
  async logout(@Req() request: AdminRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    await this.auth.logout(request.adminToken!, request.adminUser!.id);
    reply.header("Set-Cookie", this.auth.clearCookie());
    return { ok: true };
  }
}
