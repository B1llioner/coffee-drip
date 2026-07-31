import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { UserRole } from "@algi/database";
import type { AppEnv } from "../../config/env";
import { AdminAuthService } from "./admin-auth.service";
import { ADMIN_ROLES } from "./admin-roles.decorator";

export type AdminRequest = {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  adminUser?: { id: string; email: string; displayName: string; role: string };
  adminToken?: string;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly auth: AdminAuthService, private readonly reflector: Reflector, private readonly config: ConfigService<AppEnv, true>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = this.readToken(request.headers);
    if (!token) throw new UnauthorizedException("Требуется вход в админку");
    const user = await this.auth.authenticate(token);
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ADMIN_ROLES, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(user.role as UserRole)) throw new UnauthorizedException("Недостаточно прав");
    request.adminUser = user;
    request.adminToken = token;
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && typeof request.headers.cookie === "string") {
      const origin = typeof request.headers.origin === "string" ? request.headers.origin : undefined;
      const allowed = new URL(this.config.get("ADMIN_APP_URL", { infer: true })).origin;
      if (!origin || origin !== allowed) throw new UnauthorizedException("Проверка источника запроса не пройдена");
    }
    return true;
  }

  private readToken(headers: AdminRequest["headers"]): string | undefined {
    const authorization = headers.authorization;
    if (typeof authorization === "string" && authorization.startsWith("Bearer ")) return authorization.slice(7);
    const cookie = typeof headers.cookie === "string" ? headers.cookie : "";
    return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("algi_admin_session="))?.slice(19);
  }
}
