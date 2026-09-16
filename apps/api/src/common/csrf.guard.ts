import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
@Injectable()
export class CsrfGuard implements CanActivate { canActivate(context: ExecutionContext) { const request = context.switchToHttp().getRequest<{ method: string; headers: Record<string, string | undefined> }>(); if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true; if (!request.headers["x-csrf-token"] || request.headers.origin !== process.env.WEB_ORIGIN) throw new ForbiddenException("CSRF_INVALID"); return true; } }
