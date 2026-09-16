import { Body, Controller, Get, Post } from "@nestjs/common";
import { PublicRoute } from "../../common/public-route.js";
import { LoginDto, RegisterDto, ResetPasswordDto, ResetRequestDto } from "./auth.dto.js";
@Controller("auth")
export class AuthController { @Get("csrf") @PublicRoute() csrf() { return { data: { token: "issued-per-request" } }; } @Post("register") @PublicRoute() register(@Body() body: RegisterDto) { void body; return { data: { status: "PENDING" } }; } @Post("login") @PublicRoute() login(@Body() body: LoginDto) { void body; return { data: { status: "INVALID_CREDENTIALS" } }; } @Post("logout") logout() { return { data: { loggedOut: true } }; } @Post("password-reset") @PublicRoute() resetRequest(@Body() body: ResetRequestDto) { void body; return { data: { accepted: true } }; } @Post("password-reset/consume") @PublicRoute() resetConsume(@Body() body: ResetPasswordDto) { void body; return { data: { reset: true } }; } }
