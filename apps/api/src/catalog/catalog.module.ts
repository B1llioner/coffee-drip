import { Module } from "@nestjs/common";
import { CatalogController, CatalogMetaController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

@Module({ controllers: [CatalogController, CatalogMetaController], providers: [CatalogService] })
export class CatalogModule {}
