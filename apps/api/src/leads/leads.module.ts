import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { LeadsService } from "./leads.service";
import { TelegramLeadNotifier } from "./telegram-lead.notifier";
import { ConsentsController } from "./consents.controller";

@Module({ controllers: [LeadsController, ConsentsController], providers: [LeadsService, TelegramLeadNotifier] })
export class LeadsModule {}
