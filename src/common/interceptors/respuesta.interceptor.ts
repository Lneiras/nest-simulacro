import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Forma que tendrán TODAS las respuestas exitosas de la API.
export interface RespuestaExitosa<T> {
  success: true;
  data: T;
}

// Un interceptor se ejecuta alrededor del endpoint: puede modificar lo que el
// endpoint devuelve antes de enviarlo al cliente.
// Este envuelve cualquier resultado exitoso en { success: true, data: ... }
// para que el cliente siempre reciba el mismo formato.
@Injectable()
export class RespuestaInterceptor<T> implements NestInterceptor<
  T,
  RespuestaExitosa<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<RespuestaExitosa<T>> {
    // next.handle() ejecuta el endpoint; map transforma lo que este devuelve.
    return next.handle().pipe(map((data) => ({ success: true, data })));
  }
}
