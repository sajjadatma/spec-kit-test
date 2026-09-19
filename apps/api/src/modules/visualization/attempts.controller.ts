import { Body, Controller, Get, Header, Headers, Inject, Param, Post, Req, Res, StreamableFile } from "@nestjs/common";
import { IsString } from "class-validator";
import { IdentityService } from "../identity/identity.service.js";
class SubmitAttemptDto { @IsString() consentVersion!: string }
@Controller("visualizations")
export class AttemptsController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}
  @Post() async submit(@Req() request: { user: { id: string }; headers: { cookie?: string } }, @Headers("idempotency-key") key: string | undefined, @Body() body: SubmitAttemptDto) { const sessionId=request.headers.cookie?.split(";").map((part)=>part.trim()).find((part)=>part.startsWith("session_id="))?.slice("session_id=".length); if(!key||!sessionId) return { data: await this.identity.submitAttempt(request.user.id, body.consentVersion) }; return { data: await this.identity.submitAttemptIdempotent(request.user.id,sessionId,key,body.consentVersion) }; }
  @Get(":id/result") @Header("Cache-Control", "private, no-store")
  async result(@Req() request: { user: { id: string } }, @Param("id") id: string, @Res({ passthrough: true }) response: { type(value: string): unknown }) {
    const result = await this.identity.visualizationResult(request.user.id, id); response.type(result.mediaType); return new StreamableFile(result.body);
  }
  @Post(":id/retry") async retry(@Req() request: { user: { id: string } }, @Param("id") id: string, @Body() body: SubmitAttemptDto) { return { data: await this.identity.retryAttempt(request.user.id, id, body.consentVersion) }; }
  @Get(":id") async get(@Req() request: { user: { id: string } }, @Param("id") id: string) { return { data: await this.identity.getAttempt(request.user.id, id) }; }
}
