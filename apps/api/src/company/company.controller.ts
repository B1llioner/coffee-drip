import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CompanyService } from "./company.service";

@ApiTags("storefront")
@Controller("storefront/company")
export class CompanyController {
  constructor(private readonly company: CompanyService) {}

  @Get()
  @ApiOperation({ summary: "Публичные реквизиты продавца и контакты" })
  getPublicDetails() {
    return this.company.getPublicDetails();
  }
}
