import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Module({
  providers: [UsuariosService],
  // exports permite que otros módulos que importen UsuariosModule usen UsuariosService.
  exports: [UsuariosService],
})
export class UsuariosModule {}
