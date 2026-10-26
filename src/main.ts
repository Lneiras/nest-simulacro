import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ValidationPipe global: valida TODOS los DTO de la aplicación automáticamente.
  app.useGlobalPipes(
    new ValidationPipe({
      // Elimina los campos que no están declarados en el DTO...
      whitelist: true,
      // ...y además rechaza la petición (400) si llegan campos de más.
      // Así nadie puede enviar id, estado, creadaEn, etc. al registrar una reserva.
      forbidNonWhitelisted: true,
      // Convierte los datos recibidos al tipo del DTO (por ejemplo, query params).
      transform: true,
    }),
  );

  // El puerto sale del .env. Si no está definido, usamos 3000.
  const puerto = app.get(ConfigService).get<number>('PORT') ?? 3000;
  await app.listen(puerto);
}
void bootstrap();
