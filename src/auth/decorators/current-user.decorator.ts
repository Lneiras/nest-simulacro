import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SolicitudConUsuario } from '../interfaces/solicitud-con-usuario.interface';

// Decorador de parámetro para obtener al usuario validado dentro del controlador.
// Ejemplo: crear(@CurrentUser() usuario: Usuario) { ... }
// Así el controlador no necesita leer el encabezado x-user por su cuenta.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const solicitud = context.switchToHttp().getRequest<SolicitudConUsuario>();
    // El UsuarioGuard ya guardó al usuario en la petición antes de llegar aquí.
    return solicitud.usuario;
  },
);
