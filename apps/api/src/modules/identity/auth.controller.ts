import { Body, Controller, ForbiddenException, Get, Headers, HttpCode, HttpStatus, Inject, Post, Req, Res } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PublicRoute } from "../../common/public-route.js";
import { LoginDto, RegisterDto, ResetPasswordDto, ResetRequestDto } from "./auth.dto.js";
import { IdentityService } from "./identity.service.js";
type CookieResponse = { cookie(name: string, value: string, options: Record<string, unknown>): void; clearCookie(name: string, options: Record<string, unknown>): void; };
const readCookie = (header: string | undefined, name: string) => header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
const accessCookieOptions = cookieOptions;
const requestIp = (request: { ip?: string; headers: Record<string, string | undefined> }) => request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? request.ip ?? "unknown";
@Controller("auth")
export class AuthController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}

  @Get("csrf") @PublicRoute()
  csrf(@Res({ passthrough: true }) response: CookieResponse) {
    const token = randomBytes(32).toString("base64url");
    response.cookie("csrf_token", token, { httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/v1" });
    return { data: { token } };
  }

  @Get("me")
  async me(@Req() request: { user: { id: string } }) {
    return { data: request.user };
  }

  @Post("register") @PublicRoute() @HttpCode(HttpStatus.ACCEPTED)
  async register(@Body() body: RegisterDto, @Req() request: { ip?: string; headers: Record<string, string | undefined> }) {
    if (body.password !== body.passwordConfirmation) throw new Error("PASSWORD_CONFIRMATION_INVALID");
    await this.identity.rateLimit("registerIp", requestIp(request));
    await this.identity.register(body.displayName, body.email, body.password, body.locale);
    return { data: { status: "PENDING" } };
  }

  @Post("login") @PublicRoute() @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Req() request: { ip?: string; headers: Record<string, string | undefined> }, @Res({ passthrough: true }) response: CookieResponse) {
    await this.identity.rateLimit("loginIp", requestIp(request));
    await this.identity.rateLimit("loginAccount", body.email.trim().toLowerCase());
    const result = await this.identity.login(body.email, body.password);
    if (result.access !== "APPROVED") throw new ForbiddenException(result.access);
    if (result.access === "APPROVED") {
      response.cookie("access_token", result.accessToken, { ...accessCookieOptions, maxAge: 15 * 60 * 1000 });
      response.cookie("refresh_token", result.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
      response.cookie("session_id", result.session.id, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    }
    return { data: { access: result.access } };
  }

  @Post("refresh") @PublicRoute() @HttpCode(HttpStatus.OK)
  async refresh(@Headers("cookie") cookie: string | undefined, @Res({ passthrough: true }) response: CookieResponse) {
    const refreshToken = readCookie(cookie, "refresh_token");
    if (!refreshToken) throw new Error("SESSION_INVALID");
    await this.identity.rateLimit("refreshSession", readCookie(cookie, "session_id") ?? "unknown");
    const result = await this.identity.refresh(refreshToken);
    response.cookie("access_token", result.accessToken, { ...accessCookieOptions, maxAge: 15 * 60 * 1000 });
    response.cookie("refresh_token", result.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    response.cookie("session_id", result.session.id, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { data: { refreshed: true } };
  }

  @Post("logout") @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Headers("cookie") cookie: string | undefined, @Res({ passthrough: true }) response: CookieResponse) {
    const sessionId = readCookie(cookie, "session_id");
    if (sessionId) void this.identity.logout(sessionId);
    response.clearCookie("access_token", accessCookieOptions);
    response.clearCookie("refresh_token", cookieOptions);
    response.clearCookie("session_id", cookieOptions);
    return { data: { loggedOut: true } };
  }

  @Post(["password-reset", "password-reset-requests"]) @PublicRoute() @HttpCode(HttpStatus.ACCEPTED)
  async resetRequest(@Body() body: ResetRequestDto, @Req() request: { ip?: string; headers: Record<string, string | undefined> }) {
    await this.identity.rateLimit("resetIp", requestIp(request));
    await this.identity.rateLimit("resetAccount", body.email.trim().toLowerCase());
    await this.identity.requestPasswordReset(body.email);
    return { data: { accepted: true } };
  }

  @Post(["password-reset/consume", "password-resets"]) @PublicRoute() @HttpCode(HttpStatus.NO_CONTENT)
  async resetConsume(@Body() body: ResetPasswordDto, @Req() request: { ip?: string; headers: Record<string, string | undefined> }) {
    if (body.password !== body.passwordConfirmation) throw new Error("PASSWORD_CONFIRMATION_INVALID");
    await this.identity.rateLimit("resetConsumeIp", requestIp(request));
    const reset = await this.identity.consumePasswordReset(body.token, body.password);
    if (!reset) throw new Error("RESET_LINK_INVALID");
    return;
  }
}
