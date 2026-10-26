import { SetMetadata } from '@nestjs/common';
import { Rol } from '../../usuarios/rol.enum';

// Nombre con el que guardamos la lista de roles en los metadatos del endpoint.
export const ROLES_KEY = 'roles';

// Decorador personalizado para declarar qué roles pueden usar un endpoint.
// Ejemplo: @Roles(Rol.ADMIN, Rol.COORDINADOR)
// Solo guarda la lista de roles; quien la revisa realmente es el RolesGuard.
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
