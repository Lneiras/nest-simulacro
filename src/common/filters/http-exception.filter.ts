import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Un Exception Filter atrapa los errores que ocurren en la aplicación y decide
// qué respuesta se envía al cliente. @Catch() sin parámetros atrapa TODOS los errores.
// Así todas las respuestas de error tienen el mismo formato.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const contexto = host.switchToHttp();
    const solicitud = contexto.getRequest<Request>();
    const respuesta = contexto.getResponse<Response>();

    // Por defecto asumimos un error inesperado del servidor (500).
    let codigoHttp: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      // Errores que lanzamos nosotros (400, 401, 403, 404, 409...) o que lanza Nest.
      // Conservamos su código HTTP real: no los convertimos en 500.
      codigoHttp = exception.getStatus();
      mensaje = this.obtenerMensaje(exception);
    } else {
      // Error que no esperábamos (por ejemplo, la base de datos se cayó).
      // No mostramos el detalle al cliente, pero sí lo dejamos en el log del servidor.
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    respuesta.status(codigoHttp).json({
      success: false,
      statusCode: codigoHttp,
      message: mensaje,
      path: solicitud.url,
      timestamp: new Date().toISOString(),
    });
  }

  // Extrae el mensaje de la excepción.
  // Cuando falla la validación de un DTO, el mensaje es una lista con un texto por cada error.
  private obtenerMensaje(exception: HttpException): string | string[] {
    const cuerpo = exception.getResponse();

    if (typeof cuerpo === 'string') {
      return cuerpo;
    }

    const mensaje = (cuerpo as { message?: string | string[] }).message;
    return mensaje ?? exception.message;
  }
}
