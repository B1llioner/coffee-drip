import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { FastifyRequest } from "fastify";
import { CreateLeadDto } from "./create-lead.dto";
import { LeadsService } from "./leads.service";

@ApiTags("leads")
@Controller("leads")
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  create(@Body() dto: CreateLeadDto, @Req() request: FastifyRequest) {
    if (dto.website) return { id: "accepted", status: "accepted" };
    return this.leads.create(dto, { ip: request.ip, userAgent: request.headers["user-agent"] });
  }
}
