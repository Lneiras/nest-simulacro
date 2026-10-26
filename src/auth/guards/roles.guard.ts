import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../../usuarios/rol.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SolicitudConUsuario } from '../interfaces/solicitud-con-usuario.interface';

// Revisa que el rol del usuario esté entre los roles declarados con @Roles().
// Debe ejecutarse DESPUÉS del UsuarioGuard, porque necesita al usuario ya validado.
@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector es la herramienta de Nest para leer los metadatos que guardó @Roles().
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Buscamos los roles permitidos primero en el método y luego en la clase.
    const rolesPermitidos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no declaró @Roles(), no hay restricción por rol.
    if (!rolesPermitidos) {
      return true;
    }

    const solicitud = context.switchToHttp().getRequest<SolicitudConUsuario>();
    const usuario = solicitud.usuario;

    // 403: el usuario sí existe, pero su rol no tiene permiso para este endpoint.
    if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
      throw new ForbiddenException(
        'Tu rol no tiene permiso para realizar esta acción',
      );
    }

    return true;
  }
}
