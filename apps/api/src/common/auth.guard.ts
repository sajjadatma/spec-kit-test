import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC } from "./public-route.js";
import { IdentityService } from "../modules/identity/identity.service.js";
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, @Inject(IdentityService) private readonly identity: IdentityService) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<{ headers: { cookie?: string }; user?: unknown }>();
    const token = request.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("access_token="))?.slice("access_token=".length);
    if (!token) throw new UnauthorizedException("SESSION_INVALID");
    try { const claims = this.identity.verifyAccessToken(token); request.user = await this.identity.currentAccount(claims.sub, claims.sid, claims.ver); return true; } catch { throw new UnauthorizedException("SESSION_INVALID"); }
  }
}
