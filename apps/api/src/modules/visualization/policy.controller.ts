import { Controller, Get } from "@nestjs/common";

/** The policy version is captured by future submission records before a provider call. */
@Controller("visualization/policy")
export class VisualizationPolicyController {
  @Get()
  get() {
    return { data: { version: "room-surfaces-v1", consentRequired: true, acceptedFormats: ["image/jpeg", "image/png", "image/webp"], maxBytes: 25 * 1024 * 1024 } };
  }
}
