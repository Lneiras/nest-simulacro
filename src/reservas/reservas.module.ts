import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { Reserva } from './entities/reserva.entity';

// Un módulo agrupa todo lo que pertenece a una misma funcionalidad.
// Aquí agrupamos lo relacionado con las reservas.
@Module({
  imports: [
    // forFeature registra la entidad Reserva para poder usar su repositorio
    // (la herramienta de TypeORM para consultar y guardar reservas).
    TypeOrmModule.forFeature([Reserva]),
    // Necesitamos UsuariosService: lo usan los guards y, más adelante, el servicio de reservas.
    UsuariosModule,
  ],
})
export class ReservasModule {}
