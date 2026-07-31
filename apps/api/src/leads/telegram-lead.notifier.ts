import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NotificationStatus, Prisma } from "@algi/database";
import { randomUUID } from "node:crypto";
import type { AppEnv } from "../config/env";
import { PrismaService } from "../common/prisma.service";

const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
type Claimed = { id: string };

@Injectable()
export class TelegramLeadNotifier implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly config: ConfigService<AppEnv, true>, private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.process(), 10_000);
    this.timer.unref();
    this.kick();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  kick() {
    setImmediate(() => void this.process());
  }

  async process() {
    if (this.running) return;
    this.running = true;
    try {
      for (let i = 0; i < 10; i += 1) {
        const claimed = await this.claim();
        if (!claimed) break;
        await this.deliver(claimed.id);
      }
    } finally {
      this.running = false;
    }
  }

  private async claim(): Promise<Claimed | undefined> {
    const lockId = randomUUID();
    const rows = await this.prisma.$queryRaw<Claimed[]>(Prisma.sql`
      WITH candidate AS (
        SELECT id FROM lead_notifications
        WHERE channel = 'telegram'
          AND attempt_count < 5
          AND next_attempt_at <= NOW()
          AND (
            status IN ('PENDING', 'FAILED')
            OR (status = 'PROCESSING' AND locked_at < NOW() - INTERVAL '5 minutes')
          )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE lead_notifications AS notification
      SET status = 'PROCESSING', locked_at = NOW(), lock_id = ${lockId}, updated_at = NOW()
      FROM candidate
      WHERE notification.id = candidate.id
      RETURNING notification.id
    `);
    return rows[0];
  }

  private async deliver(notificationId: string) {
    const notification = await this.prisma.leadNotification.findUnique({ where: { id: notificationId }, include: { lead: true } });
    if (!notification) return;
    const token = this.config.get("TELEGRAM_BOT_TOKEN", { infer: true });
    const chatId = this.config.get("TELEGRAM_LEADS_CHAT_ID", { infer: true });
    if (!token || !chatId) {
      await this.prisma.leadNotification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SKIPPED, lockedAt: null, lockId: null, lastError: "Telegram is not configured" },
      });
      return;
    }

    const lead = notification.lead;
    const adminUrl = `${this.config.get("ADMIN_APP_URL", { infer: true })}?lead=${encodeURIComponent(lead.id)}`;
    const lines = [
      "<b>Новая заявка ALGI GROUP</b>",
      `Номер: <code>${escapeHtml(lead.publicId)}</code>`,
      `Тип: ${escapeHtml(lead.audience)}`,
      `Источник: ${escapeHtml(lead.sourcePage)}`,
      `<a href="${escapeHtml(adminUrl)}">Открыть в защищённой админке</a>`,
    ];
    if (this.config.get("TELEGRAM_INCLUDE_PERSONAL_DATA", { infer: true })) {
      lines.splice(2, 0, `Имя: ${escapeHtml(lead.name)}`, `Телефон: ${escapeHtml(lead.phone ?? "—")}`, `Email: ${escapeHtml(lead.email ?? "—")}`);
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), parse_mode: "HTML", disable_web_page_preview: true }),
        signal: AbortSignal.timeout(7_000),
      });
      if (!response.ok) throw new Error(`Telegram responded with HTTP ${response.status}`);
      await this.prisma.leadNotification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENT, sentAt: new Date(), attemptCount: { increment: 1 }, lastError: null, lockedAt: null, lockId: null },
      });
    } catch (error) {
      const attempt = notification.attemptCount + 1;
      const delaySeconds = Math.min(15 * 2 ** (attempt - 1), 15 * 60);
      await this.prisma.leadNotification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          attemptCount: { increment: 1 },
          lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown notification error",
          nextAttemptAt: new Date(Date.now() + delaySeconds * 1_000),
          lockedAt: null,
          lockId: null,
        },
      });
    }
  }
}
