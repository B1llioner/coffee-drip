import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();
    const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = error instanceof HttpException ? error.getResponse() : undefined;
    const details = typeof body === "object" && body !== null && "message" in body ? body.message : undefined;

    response.status(status).send({
      error: {
        code: status === 500 ? "INTERNAL_ERROR" : `HTTP_${status}`,
        message: status === 500 ? "Внутренняя ошибка сервиса" : typeof body === "string" ? body : "Запрос не выполнен",
        ...(details ? { details } : {}),
        requestId: request.id,
      },
    });
  }
}
