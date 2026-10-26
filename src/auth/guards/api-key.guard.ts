import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// Un guard decide si una petición puede continuar o no.
// Este revisa que llegue un encabezado x-api-key con una clave válida (RN-04).
@Injectable()
export class ApiKeyGuard implements CanActivate {
  // Lista de claves válidas, leída del archivo .env (nunca escritas en el código).
  private readonly clavesValidas: string[];

  constructor(config: ConfigService) {
    // API_KEYS llega como un solo texto: "clave1,clave2".
    // split(',') lo separa en una lista; trim() quita espacios accidentales
    // alrededor de cada clave; filter descarta las que queden vacías.
    this.clavesValidas = (config.get<string>('API_KEYS') ?? '')
      .split(',')
      .map((clave) => clave.trim())
      .filter((clave) => clave !== '');
  }

  canActivate(context: ExecutionContext): boolean {
    const solicitud = context.switchToHttp().getRequest<Request>();
    const clave = solicitud.header('x-api-key');

    // Si no se envía la clave o no está en la lista, se rechaza con 401.
    // Al lanzar la excepción aquí, el endpoint nunca se ejecuta.
    if (!clave || !this.clavesValidas.includes(clave)) {
      throw new UnauthorizedException('API Key faltante o inválida');
    }

    return true;
  }
}
