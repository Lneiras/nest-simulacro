import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { SolicitudConUsuario } from '../interfaces/solicitud-con-usuario.interface';

// Valida que el encabezado x-user corresponda a un usuario que existe.
// Nunca confiamos en un rol enviado por el cliente: el rol lo tomamos
// del usuario que encontramos en el sistema.
@Injectable()
export class UsuarioGuard implements CanActivate {
  constructor(private readonly usuariosService: UsuariosService) {}

  canActivate(context: ExecutionContext): boolean {
    const solicitud = context.switchToHttp().getRequest<SolicitudConUsuario>();
    const idUsuario = solicitud.header('x-user');

    // Si no se envía x-user o el usuario no existe, se rechaza con 401.
    const usuario = idUsuario
      ? this.usuariosService.buscarPorId(idUsuario)
      : undefined;
    if (!usuario) {
      throw new UnauthorizedException(
        'Usuario (x-user) faltante o inexistente',
      );
    }

    // Guardamos al usuario en la petición para que el RolesGuard
    // y el decorador @CurrentUser puedan usarlo después.
    solicitud.usuario = usuario;
    return true;
  }
}
