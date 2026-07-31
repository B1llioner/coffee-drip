import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CatalogQueryDto } from "./catalog.dto";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@Controller("catalog/products")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get() list(@Query() query: CatalogQueryDto) { return this.catalog.list(query); }
  @Get(":slug") bySlug(@Param("slug") slug: string) { return this.catalog.bySlug(slug); }
}

@ApiTags("catalog")
@Controller("catalog")
export class CatalogMetaController {
  constructor(private readonly catalog: CatalogService) {}
  @Get("brands") brands() { return this.catalog.brands(); }
  @Get("countries") countries() { return this.catalog.countries(); }
}
