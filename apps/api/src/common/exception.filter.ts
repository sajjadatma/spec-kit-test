import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { randomUUID } from "node:crypto";
@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) { const response = host.switchToHttp().getResponse(); const requestId = randomUUID(); const code = exception instanceof Error ? exception.message : "INTERNAL_ERROR"; const status = exception instanceof HttpException ? exception.getStatus() : ({ INVALID_CREDENTIALS: 401, SESSION_INVALID: 401, REFRESH_REPLAY: 401, EMAIL_TAKEN: 409, RESET_LINK_INVALID: 400, PASSWORD_CONFIRMATION_INVALID: 400, RATE_LIMITED: 429, FORBIDDEN: 403, RECORD_NOT_FOUND: 404, REVISION_REQUIRED: 428, REVISION_CONFLICT: 409, LAST_SUPER_ADMIN: 409 } as Record<string, number>)[code] ?? HttpStatus.INTERNAL_SERVER_ERROR; if (status === 500) console.error(JSON.stringify({ operation: "http.request", outcome: "failed", requestId, errorName: exception instanceof Error ? exception.name : "UnknownError" })); response.status(status).json({ error: { code: status === 500 ? "INTERNAL_ERROR" : code, message: "Request could not be completed.", requestId } }); }
}
