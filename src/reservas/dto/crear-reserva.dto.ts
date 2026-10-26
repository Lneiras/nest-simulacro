import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
// Los decoradores @ApiProperty son solo para Swagger: documentan cada campo con un ejemplo.
//
// IMPORTANTE: aquí NO existen id, estado, creadaEn ni actualizadaEn.
// Como el ValidationPipe usa "forbidNonWhitelisted", si el cliente envía alguno
// de esos campos la petición se rechaza. Los genera el sistema, no el cliente.
export class CrearReservaDto {
  // Obligatorio y no puede ser un texto vacío.
  @ApiProperty({
    description: 'Nombre completo del huésped',
    example: 'Ana María Pérez',
  })
  @IsString({ message: 'huesped debe ser un texto' })
  @IsNotEmpty({ message: 'huesped es obligatorio y no puede estar vacío' })
  huesped: string;

  // Solo dígitos, entre 6 y 12 caracteres. La expresión regular ^\d{6,12}$ significa:
  // desde el inicio (^) hasta el final ($) solo dígitos (\d), mínimo 6 y máximo 12.
  @ApiProperty({
    description: 'Número de documento del huésped (solo dígitos, de 6 a 12)',
    example: '1045678901',
  })
  @Matches(/^\d{6,12}$/, {
    message: 'documentoHuesped debe tener solo dígitos (entre 6 y 12)',
  })
  documentoHuesped: string;

  // Debe ser uno de los valores del enum: SENCILLA, DOBLE o SUITE.
  @ApiProperty({
    description: 'Tipo de habitación',
    enum: TipoHabitacion,
    example: TipoHabitacion.DOBLE,
  })
  @IsEnum(TipoHabitacion, {
    message: 'tipoHabitacion debe ser SENCILLA, DOBLE o SUITE',
  })
  tipoHabitacion: TipoHabitacion;

  // Fecha en formato ISO 8601 de solo día (AAAA-MM-DD), por ejemplo 2027-02-13.
  // Usamos dos validaciones juntas:
  // - @Matches exige exactamente ese formato (así podemos comparar fechas como texto).
  // - @IsDateString con "strict" rechaza fechas imposibles como 2027-02-30.
  @ApiProperty({
    description:
      'Fecha de llegada (ISO 8601, AAAA-MM-DD). No puede estar en el pasado',
    example: '2027-02-13',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaIngreso debe tener el formato AAAA-MM-DD (ej: 2027-02-13)',
  })
  @IsDateString(
    { strict: true },
    { message: 'fechaIngreso debe ser una fecha válida (ej: 2027-02-13)' },
  )
  fechaIngreso: string;

  @ApiProperty({
    description:
      'Fecha de salida (ISO 8601, AAAA-MM-DD). Debe ser posterior a fechaIngreso',
    example: '2027-02-15',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaSalida debe tener el formato AAAA-MM-DD (ej: 2027-02-15)',
  })
  @IsDateString(
    { strict: true },
    { message: 'fechaSalida debe ser una fecha válida (ej: 2027-02-15)' },
  )
  fechaSalida: string;

  // Es opcional en el DTO porque depende del rol de quien hace la petición (RN-01):
  // - recepcionista: se ignora, la reserva queda a su nombre.
  // - admin o coordinador: es obligatorio. Esa regla se valida en el servicio,
  //   porque el DTO no sabe quién está haciendo la petición.
  @ApiPropertyOptional({
    description:
      'Id del recepcionista responsable. Obligatorio si quien registra es admin o coordinador; si es un recepcionista, se ignora',
    example: 'recep1',
  })
  @IsOptional()
  @IsString({ message: 'recepcionista debe ser un texto' })
  recepcionista?: string;
}
