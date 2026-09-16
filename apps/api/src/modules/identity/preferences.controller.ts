import { Controller, Get } from "@nestjs/common";
@Controller("me")
export class PreferencesController { @Get("preferences") getPreferences() { return { data: { locale: "en" } }; } }
