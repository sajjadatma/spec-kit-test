import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { PreferencesController } from "./preferences.controller.js";
import { UsersController } from "./users.controller.js";
import { ProductsController } from "../catalog/products.controller.js";
import { PricingController } from "../pricing/pricing.controller.js";
import { IdentityService } from "./identity.service.js";
@Module({ controllers: [AuthController, PreferencesController, UsersController, ProductsController, PricingController], providers: [IdentityService] })
export class IdentityModule {}
