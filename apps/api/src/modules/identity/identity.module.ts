import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { PreferencesController } from "./preferences.controller.js";
import { IdentityService } from "./identity.service.js";
@Module({ controllers: [AuthController, PreferencesController], providers: [IdentityService] })
export class IdentityModule {}
