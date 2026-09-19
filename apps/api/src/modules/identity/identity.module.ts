import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { PreferencesController } from "./preferences.controller.js";
import { UsersController } from "./users.controller.js";
import { ProductsController } from "../catalog/products.controller.js";
import { PricingController } from "../pricing/pricing.controller.js";
import { UploadsController } from "../media/uploads.controller.js";
import { ProductImagesController } from "../media/product-images.controller.js";
import { DraftsController } from "../visualization/drafts.controller.js";
import { AttemptsController } from "../visualization/attempts.controller.js";
import { HistoryController } from "../visualization/history.controller.js";
import { VisualizationPolicyController } from "../visualization/policy.controller.js";
import { IdentityService } from "./identity.service.js";
@Module({ controllers: [AuthController, PreferencesController, UsersController, ProductsController, PricingController, UploadsController, ProductImagesController, DraftsController, AttemptsController, VisualizationPolicyController, HistoryController], providers: [IdentityService] })
export class IdentityModule {}
