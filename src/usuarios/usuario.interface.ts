import { Rol } from './rol.enum';

// Forma que tiene un usuario del sistema.
// Los usuarios no se guardan en la base de datos, viven en memoria (ver UsuariosService).
export interface Usuario {
  id: string; // Es el valor que el cliente envía en el encabezado x-user
  rol: Rol;
}
