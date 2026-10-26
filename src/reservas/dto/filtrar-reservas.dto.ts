import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoReserva } from '../enums/estado-reserva.enum';

// DTO para los parámetros de consulta (query) de GET /reservas.
// Ejemplo: GET /reservas?estado=CONFIRMADA
export class FiltrarReservasDto {
  // Es opcional: si no se envía, se listan todas las reservas permitidas.
  // Si se envía, debe ser un estado válido; si no, se responde 400.
  @ApiPropertyOptional({
    description: 'Filtra el listado por estado de la reserva',
    enum: EstadoReserva,
    example: EstadoReserva.CONFIRMADA,
  })
  @IsOptional()
  @IsEnum(EstadoReserva, {
    message:
      'estado debe ser PENDIENTE, CONFIRMADA, EN_CURSO, FINALIZADA o CANCELADA',
  })
  estado?: EstadoReserva;
}
