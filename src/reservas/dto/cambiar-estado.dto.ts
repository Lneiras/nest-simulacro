import { IsEnum } from 'class-validator';
import { EstadoReserva } from '../enums/estado-reserva.enum';

// DTO para la operación PATCH /reservas/:id/estado.
// Solo se puede enviar el nuevo estado; ningún otro campo de la reserva.
export class CambiarEstadoDto {
  // Debe ser uno de los estados permitidos del enum.
  @IsEnum(EstadoReserva, {
    message:
      'estado debe ser PENDIENTE, CONFIRMADA, EN_CURSO, FINALIZADA o CANCELADA',
  })
  estado: EstadoReserva;
}
