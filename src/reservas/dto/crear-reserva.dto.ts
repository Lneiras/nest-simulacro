import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { TipoHabitacion } from '../enums/tipo-habitacion.enum';

// Un DTO (Data Transfer Object) define qué datos aceptamos en el cuerpo de la petición.
// Los decoradores de class-validator indican las reglas que cada campo debe cumplir.
// Si algo no se cumple, el ValidationPipe global responde con un error 400.
//
// IMPORTANTE: aquí NO existen id, estado, creadaEn ni actualizadaEn.
// Como el ValidationPipe usa "forbidNonWhitelisted", si el cliente envía alguno
// de esos campos la petición se rechaza. Los genera el sistema, no el cliente.
export class CrearReservaDto {
  // Obligatorio y no puede ser un texto vacío.
  @IsString({ message: 'huesped debe ser un texto' })
  @IsNotEmpty({ message: 'huesped es obligatorio y no puede estar vacío' })
  huesped: string;

  // Solo dígitos, entre 6 y 12 caracteres. La expresión regular ^\d{6,12}$ significa:
  // desde el inicio (^) hasta el final ($) solo dígitos (\d), mínimo 6 y máximo 12.
  @Matches(/^\d{6,12}$/, {
    message: 'documentoHuesped debe tener solo dígitos (entre 6 y 12)',
  })
  documentoHuesped: string;

  // Debe ser uno de los valores del enum: SENCILLA, DOBLE o SUITE.
  @IsEnum(TipoHabitacion, {
    message: 'tipoHabitacion debe ser SENCILLA, DOBLE o SUITE',
  })
  tipoHabitacion: TipoHabitacion;

  // Fecha en formato ISO 8601, por ejemplo 2027-02-13.
  // "strict" rechaza fechas imposibles como 2027-02-30.
  @IsDateString(
    { strict: true },
    {
      message:
        'fechaIngreso debe ser una fecha válida en formato ISO 8601 (ej: 2027-02-13)',
    },
  )
  fechaIngreso: string;

  @IsDateString(
    { strict: true },
    {
      message:
        'fechaSalida debe ser una fecha válida en formato ISO 8601 (ej: 2027-02-15)',
    },
  )
  fechaSalida: string;

  // Es opcional en el DTO porque depende del rol de quien hace la petición (RN-01):
  // - recepcionista: se ignora, la reserva queda a su nombre.
  // - admin o coordinador: es obligatorio. Esa regla se valida en el servicio,
  //   porque el DTO no sabe quién está haciendo la petición.
  @IsOptional()
  @IsString({ message: 'recepcionista debe ser un texto' })
  recepcionista?: string;
}
