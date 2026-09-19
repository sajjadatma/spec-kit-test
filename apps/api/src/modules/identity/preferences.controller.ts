import { Body, Controller, Get, Inject, Patch, Req } from "@nestjs/common";
import { IdentityService } from "./identity.service.js";
import { UpdatePreferencesDto } from "./auth.dto.js";
@Controller("users/me")
export class PreferencesController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}
  @Get("preferences") async getPreferences(@Req() request: { user: { id: string } }) { const account = await this.identity.currentAccount(request.user.id); return { data: { locale: account.locale } }; }
  @Patch("preferences") async updatePreferences(@Req() request: { user: { id: string } }, @Body() body: UpdatePreferencesDto) { return { data: await this.identity.updatePreferences(request.user.id, body.locale) }; }
}
