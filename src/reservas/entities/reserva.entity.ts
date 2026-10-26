import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoReserva } from '../enums/estado-reserva.enum';
import { TipoHabitacion } from '../enums/tipo-habitacion.enum';

// @Entity() le dice a TypeORM que esta clase representa una tabla en la base de datos.
// Cada propiedad con @Column() será una columna de esa tabla.
@Entity('reservas')
export class Reserva {
  // Identificador numérico que la base de datos genera sola (1, 2, 3...).
  @PrimaryGeneratedColumn()
  id: number;

  // Nombre completo del huésped.
  @Column()
  huesped: string;

  // Se guarda como texto (varchar) para no perder ceros a la izquierda.
  @Column({ type: 'varchar', length: 12 })
  documentoHuesped: string;

  @Column({ type: 'enum', enum: TipoHabitacion })
  tipoHabitacion: TipoHabitacion;

  // El tipo 'date' guarda solo el día (sin hora). TypeORM lo devuelve como texto "2027-02-13".
  @Column({ type: 'date' })
  fechaIngreso: string;

  @Column({ type: 'date' })
  fechaSalida: string;

  // Guardamos el identificador del recepcionista responsable (por ejemplo "recep1").
  // Los usuarios viven en memoria, por eso no hay una relación con otra tabla.
  @Column()
  recepcionista: string;

  // Si no indicamos estado al guardar, la base de datos usa PENDIENTE.
  @Column({
    type: 'enum',
    enum: EstadoReserva,
    default: EstadoReserva.PENDIENTE,
  })
  estado: EstadoReserva;

  // TypeORM llena esta fecha automáticamente al crear la reserva.
  @CreateDateColumn()
  creadaEn: Date;

  // TypeORM actualiza esta fecha automáticamente cada vez que se modifica la reserva.
  @UpdateDateColumn()
  actualizadaEn: Date;
}
