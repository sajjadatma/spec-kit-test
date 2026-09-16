import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Module, Controller, Get, ValidationPipe } from "@nestjs/common";
import { SafeExceptionFilter } from "./common/exception.filter.js";
import { PublicRoute } from "./common/public-route.js";

@Controller("health")
class HealthController { @Get() @PublicRoute() status() { return { data: { status: "ok" } }; } }
@Module({ controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: false }));
  app.useGlobalFilters(new SafeExceptionFilter());
  await app.listen(process.env.API_PORT ?? 3001);
}
void bootstrap();
