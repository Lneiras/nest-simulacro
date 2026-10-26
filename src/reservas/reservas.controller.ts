import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsuarioGuard } from '../auth/guards/usuario.guard';
import { Rol } from '../usuarios/rol.enum';
// "import type" porque Usuario es una interfaz (solo existe en TypeScript, no en JavaScript).
import type { Usuario } from '../usuarios/usuario.interface';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { FiltrarReservasDto } from './dto/filtrar-reservas.dto';
import { ReservasService } from './reservas.service';

// El controlador define las rutas (endpoints) y delega el trabajo al servicio.
// Todas las rutas empiezan con /reservas.
//
// Los guards se ejecutan en el orden en que se escriben:
// 1. ApiKeyGuard: valida x-api-key (si falla, el endpoint nunca se ejecuta).
// 2. UsuarioGuard: valida que x-user exista y guarda al usuario en la petición.
// 3. RolesGuard: revisa que el rol del usuario esté permitido con @Roles().
@Controller('reservas')
@UseGuards(ApiKeyGuard, UsuarioGuard, RolesGuard)
// Los tres roles pueden usar estos endpoints. Las reglas más finas
// (por ejemplo, que un recepcionista solo vea sus reservas) las aplica el servicio.
@Roles(Rol.ADMIN, Rol.COORDINADOR, Rol.RECEPCIONISTA)
// Decoradores de Swagger (solo documentan, no cambian el comportamiento):
// - ApiTags agrupa los endpoints bajo el título "Reservas".
// - ApiSecurity indica que se necesita la API Key (el botón "Authorize" de Swagger).
// - ApiHeader muestra el encabezado x-user como obligatorio en cada endpoint.
@ApiTags('Reservas')
@ApiSecurity('x-api-key')
@ApiHeader({
  name: 'x-user',
  required: true,
  description: 'Usuario que hace la petición: admin1, coord1, recep1 o recep2',
  example: 'recep1',
})
@ApiUnauthorizedResponse({
  description: 'x-api-key faltante o inválida, o x-user faltante o inexistente',
})
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  // POST /reservas -> registrar una reserva
  @Post()
  @ApiOperation({
    summary: 'Registrar una reserva',
    description:
      'El estado inicial siempre es PENDIENTE. Si quien registra es recepcionista, la reserva queda a su nombre. ' +
      'Si es admin o coordinador, debe indicar un recepcionista existente en el campo "recepcionista".',
  })
  @ApiCreatedResponse({ description: 'Reserva creada' })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos, fechas incorrectas o recepcionista responsable inválido',
  })
  crear(@Body() dto: CrearReservaDto, @CurrentUser() usuario: Usuario) {
    return this.reservasService.crear(dto, usuario);
  }

  // GET /reservas?estado=CONFIRMADA -> listar las reservas permitidas para el usuario
  @Get()
  @ApiOperation({
    summary: 'Listar reservas',
    description:
      'Admin y coordinador ven todas las reservas. Un recepcionista solo ve las suyas. ' +
      'El filtro opcional por estado se combina con esa restricción.',
  })
  @ApiOkResponse({
    description: 'Lista de reservas permitidas para el usuario',
  })
  @ApiBadRequestResponse({ description: 'El valor de "estado" no es válido' })
  listar(@Query() filtro: FiltrarReservasDto, @CurrentUser() usuario: Usuario) {
    return this.reservasService.listar(filtro, usuario);
  }

  // GET /reservas/:id -> consultar una reserva
  // ParseIntPipe convierte el id a número y responde 400 si no es un número.
  @Get(':id')
  @ApiOperation({
    summary: 'Consultar una reserva por id',
    description:
      'Un recepcionista solo puede consultar las reservas que tiene asignadas.',
  })
  @ApiParam({ name: 'id', description: 'Id de la reserva', example: 1 })
  @ApiOkResponse({ description: 'Reserva encontrada' })
  @ApiBadRequestResponse({ description: 'El id no es un número' })
  @ApiForbiddenResponse({
    description: 'El recepcionista intenta ver una reserva de otro',
  })
  @ApiNotFoundResponse({ description: 'La reserva no existe' })
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.reservasService.obtenerPorId(id, usuario);
  }

  // PATCH /reservas/:id/estado -> cambiar el estado de una reserva
  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Cambiar el estado de una reserva',
    description:
      'Cambios permitidos: PENDIENTE -> CONFIRMADA -> EN_CURSO -> FINALIZADA. ' +
      'PENDIENTE y CONFIRMADA también pueden pasar a CANCELADA (solo admin y coordinador). ' +
      'FINALIZADA y CANCELADA son estados finales. Un recepcionista solo cambia el estado de sus reservas.',
  })
  @ApiParam({ name: 'id', description: 'Id de la reserva', example: 1 })
  @ApiOkResponse({ description: 'Estado actualizado' })
  @ApiBadRequestResponse({ description: 'Estado inválido o id no numérico' })
  @ApiForbiddenResponse({
    description:
      'Reserva de otro recepcionista, o un recepcionista intenta cancelar',
  })
  @ApiNotFoundResponse({ description: 'La reserva no existe' })
  @ApiConflictResponse({
    description:
      'Transición de estado inválida (el mensaje indica el estado actual y el solicitado)',
  })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.reservasService.cambiarEstado(id, dto, usuario);
  }
}
