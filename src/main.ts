import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RespuestaInterceptor } from './common/interceptors/respuesta.interceptor';

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

  // Estandariza las respuestas exitosas: { success: true, data: ... }
  app.useGlobalInterceptors(new RespuestaInterceptor());

  // Estandariza los errores: código HTTP, mensaje, ruta y fecha.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuración de Swagger: describe la API y cómo se usa la API Key.
  const configuracionSwagger = new DocumentBuilder()
    .setTitle('API de Reservas Hoteleras - Arenosa Hoteles')
    .setDescription(
      'API REST para registrar y consultar reservas. ' +
        'Todos los endpoints requieren los encabezados x-api-key y x-user. ' +
        'Usuarios de prueba: admin1 (admin), coord1 (coordinador), recep1 y recep2 (recepcionista).',
    )
    .setVersion('1.0')
    // Declara que existe un esquema de seguridad llamado "x-api-key" que viaja en un encabezado.
    // Swagger lo muestra en el botón "Authorize".
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();
  const documento = SwaggerModule.createDocument(app, configuracionSwagger);
  // La documentación queda disponible en http://localhost:3000/docs
  SwaggerModule.setup('docs', app, documento);

  // El puerto sale del .env. Si no está definido, usamos 3000.
  const puerto = app.get(ConfigService).get<number>('PORT') ?? 3000;
  await app.listen(puerto);
}
void bootstrap();
