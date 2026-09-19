import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Module, Controller, Get, ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "./common/auth.guard.js";
import { CsrfGuard } from "./common/csrf.guard.js";
import { IdentityService } from "./modules/identity/identity.service.js";
import { SafeExceptionFilter } from "./common/exception.filter.js";
import { PublicRoute } from "./common/public-route.js";
import { IdentityModule } from "./modules/identity/identity.module.js";

@Controller("health")
class HealthController { @Get() @PublicRoute() status() { return { data: { status: "ok" } }; } }
@Module({ imports: [IdentityModule], controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.enableCors({ origin: process.env.WEB_ORIGIN, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: false }));
  app.useGlobalGuards(new AuthGuard(app.get(Reflector), app.get(IdentityService)), new CsrfGuard());
  app.useGlobalFilters(new SafeExceptionFilter());
  await app.listen(process.env.API_PORT ?? 3001);
}
void bootstrap();
