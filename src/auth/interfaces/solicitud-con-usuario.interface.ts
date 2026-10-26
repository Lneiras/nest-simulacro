import { Request } from 'express';
import { Usuario } from '../../usuarios/usuario.interface';

// Es la petición normal de Express, pero con una propiedad extra "usuario".
// El UsuarioGuard guarda ahí al usuario validado para que otras partes
// (como el decorador @CurrentUser) puedan leerlo.
export interface SolicitudConUsuario extends Request {
  usuario?: Usuario;
}
