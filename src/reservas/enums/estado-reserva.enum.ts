// Estados por los que puede pasar una reserva durante su ciclo de vida.
// El flujo normal es: PENDIENTE -> CONFIRMADA -> EN_CURSO -> FINALIZADA.
// CANCELADA solo se puede alcanzar desde PENDIENTE o CONFIRMADA.
export enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  EN_CURSO = 'EN_CURSO', // El huésped hizo check-in
  FINALIZADA = 'FINALIZADA', // El huésped hizo check-out
  CANCELADA = 'CANCELADA',
}
