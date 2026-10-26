import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from './entities/reserva.entity';

// Un módulo agrupa todo lo que pertenece a una misma funcionalidad.
// Aquí agrupamos lo relacionado con las reservas.
@Module({
  // forFeature registra la entidad Reserva para poder usar su repositorio
  // (la herramienta de TypeORM para consultar y guardar reservas).
  imports: [TypeOrmModule.forFeature([Reserva])],
})
export class ReservasModule {}
