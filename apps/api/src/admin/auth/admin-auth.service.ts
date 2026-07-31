import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";
import type { AppEnv } from "../../config/env";
import { PrismaService } from "../../common/prisma.service";
import { hashPassword, verifyPassword } from "./password";

@Injectable()
export class AdminAuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  async onModuleInit() {
    const email = this.config.get("ADMIN_BOOTSTRAP_EMAIL", { infer: true });
    const password = this.config.get("ADMIN_BOOTSTRAP_PASSWORD", { infer: true });
    if (!email || !password) return;

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (!exists) {
      await this.prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(password),
          displayName: this.config.get("ADMIN_BOOTSTRAP_NAME", { infer: true }),
          role: "ADMIN",
        },
      });
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user?.isActive || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.config.get("ADMIN_SESSION_HOURS", { infer: true }) * 3_600_000);
    await this.prisma.session.create({
      data: { userId: user.id, refreshTokenHash: this.hashToken(token), expiresAt },
    });
    await this.audit(user.id, "auth.login", "session");

    return { token, expiresAt, user: this.publicUser(user) };
  }

  assertOrigin(origin?: string) {
    if (!origin && this.config.get("NODE_ENV", { infer: true }) !== "production") return;
    const allowed = new URL(this.config.get("ADMIN_APP_URL", { infer: true })).origin;
    if (!origin || origin !== allowed) throw new UnauthorizedException("Недопустимый источник запроса");
  }

  async authenticate(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: this.hashToken(token) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive) {
      throw new UnauthorizedException("Сессия недействительна");
    }
    return this.publicUser(session.user);
  }

  async logout(token: string, actorId: string) {
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: this.hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit(actorId, "auth.logout", "session");
  }

  cookie(token: string, expiresAt: Date): string {
    const secure = this.config.get("NODE_ENV", { infer: true }) === "production" ? "; Secure" : "";
    return `algi_admin_session=${token}; Path=/api/v1/admin; HttpOnly; SameSite=Strict; Expires=${expiresAt.toUTCString()}${secure}`;
  }

  clearCookie(): string {
    const secure = this.config.get("NODE_ENV", { infer: true }) === "production" ? "; Secure" : "";
    return `algi_admin_session=; Path=/api/v1/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private publicUser(user: { id: string; email: string; displayName: string; role: string }) {
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
  }

  private async audit(actorId: string, action: string, entityType: string) {
    await this.prisma.auditLog.create({ data: { actorId, action, entityType } });
  }
}
