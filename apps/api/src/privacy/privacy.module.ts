import { Module } from "@nestjs/common";
import { DataRetentionService } from "./data-retention.service";
import { PrivacyController } from "./privacy.controller";

@Module({ controllers: [PrivacyController], providers: [DataRetentionService] })
export class PrivacyModule {}
