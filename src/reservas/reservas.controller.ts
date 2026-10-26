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
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  // POST /reservas -> registrar una reserva
  @Post()
  crear(@Body() dto: CrearReservaDto, @CurrentUser() usuario: Usuario) {
    return this.reservasService.crear(dto, usuario);
  }

  // GET /reservas?estado=CONFIRMADA -> listar las reservas permitidas para el usuario
  @Get()
  listar(@Query() filtro: FiltrarReservasDto, @CurrentUser() usuario: Usuario) {
    return this.reservasService.listar(filtro, usuario);
  }

  // GET /reservas/:id -> consultar una reserva
  // ParseIntPipe convierte el id a número y responde 400 si no es un número.
  @Get(':id')
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.reservasService.obtenerPorId(id, usuario);
  }

  // PATCH /reservas/:id/estado -> cambiar el estado de una reserva
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.reservasService.cambiarEstado(id, dto, usuario);
  }
}
