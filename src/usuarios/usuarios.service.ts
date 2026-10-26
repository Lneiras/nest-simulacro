import { Injectable } from '@nestjs/common';
import { Rol } from './rol.enum';
import { Usuario } from './usuario.interface';

// @Injectable() permite que Nest cree este servicio y lo entregue a las clases que lo pidan.
@Injectable()
export class UsuariosService {
  // Usuarios de prueba definidos en memoria (el simulacro no pide login ni tabla de usuarios).
  // Hay dos recepcionistas para poder demostrar que uno no ve las reservas del otro.
  // Este mecanismo es solo académico, no es una autenticación real.
  private readonly usuarios: Usuario[] = [
    { id: 'admin1', rol: Rol.ADMIN },
    { id: 'coord1', rol: Rol.COORDINADOR },
    { id: 'recep1', rol: Rol.RECEPCIONISTA },
    { id: 'recep2', rol: Rol.RECEPCIONISTA },
  ];

  // Busca un usuario por su id. Devuelve undefined si no existe.
  buscarPorId(id: string): Usuario | undefined {
    return this.usuarios.find((usuario) => usuario.id === id);
  }
}
