import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Rol } from '../usuarios/rol.enum';
import { Usuario } from '../usuarios/usuario.interface';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CambiarEstadoDto } from './dto/cambiar-estado.dto';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { FiltrarReservasDto } from './dto/filtrar-reservas.dto';
import { Reserva } from './entities/reserva.entity';
import { EstadoReserva } from './enums/estado-reserva.enum';

// El id de la reserva es un entero de PostgreSQL (tipo integer), que llega hasta este valor.
// Si alguien consulta un id mayor, PostgreSQL lanzaría un error interno (500),
// así que lo revisamos antes de consultar la base de datos.
const ID_MAXIMO = 2147483647;

// El servicio contiene la lógica de negocio. El controlador solo recibe la petición
// y se la pasa al servicio, así cada clase tiene una única responsabilidad.
@Injectable()
export class ReservasService {
  // Transiciones de estado permitidas (RN-03).
  // La clave es el estado actual y el valor es la lista de estados a los que puede pasar.
  // FINALIZADA y CANCELADA tienen la lista vacía porque son estados finales.
  private readonly transicionesPermitidas: Record<
    EstadoReserva,
    EstadoReserva[]
  > = {
    [EstadoReserva.PENDIENTE]: [
      EstadoReserva.CONFIRMADA,
      EstadoReserva.CANCELADA,
    ],
    [EstadoReserva.CONFIRMADA]: [
      EstadoReserva.EN_CURSO,
      EstadoReserva.CANCELADA,
    ],
    [EstadoReserva.EN_CURSO]: [EstadoReserva.FINALIZADA],
    [EstadoReserva.FINALIZADA]: [],
    [EstadoReserva.CANCELADA]: [],
  };

  constructor(
    // Repositorio de TypeORM: nos da métodos para consultar y guardar reservas.
    @InjectRepository(Reserva)
    private readonly reservasRepository: Repository<Reserva>,
    private readonly usuariosService: UsuariosService,
  ) {}

  // RN-01: registrar una reserva.
  async crear(dto: CrearReservaDto, usuario: Usuario): Promise<Reserva> {
    const recepcionista = this.obtenerRecepcionistaResponsable(dto, usuario);
    this.validarFechas(dto.fechaIngreso, dto.fechaSalida);

    // create() arma el objeto Reserva y save() lo inserta en la base de datos.
    // El estado inicial siempre es PENDIENTE, sin importar lo que envíe el cliente.
    const reserva = this.reservasRepository.create({
      huesped: dto.huesped,
      documentoHuesped: dto.documentoHuesped,
      tipoHabitacion: dto.tipoHabitacion,
      fechaIngreso: dto.fechaIngreso,
      fechaSalida: dto.fechaSalida,
      recepcionista,
      estado: EstadoReserva.PENDIENTE,
    });
    return this.reservasRepository.save(reserva);
  }

  // RN-02: listar reservas según el rol, con filtro opcional por estado.
  async listar(
    filtro: FiltrarReservasDto,
    usuario: Usuario,
  ): Promise<Reserva[]> {
    // Armamos las condiciones del WHERE de la consulta SQL.
    const condiciones: FindOptionsWhere<Reserva> = {};

    // Si llegó el filtro por estado, lo agregamos.
    if (filtro.estado) {
      condiciones.estado = filtro.estado;
    }

    // Un recepcionista solo ve sus reservas. Esta condición va en la consulta
    // a la base de datos, no se filtra después en memoria.
    // Se combina con el filtro por estado: nunca lo reemplaza.
    if (usuario.rol === Rol.RECEPCIONISTA) {
      condiciones.recepcionista = usuario.id;
    }

    return this.reservasRepository.find({
      where: condiciones,
      order: { id: 'ASC' },
    });
  }

  // Consulta de una reserva individual. Aplica las mismas reglas de acceso que el listado.
  async obtenerPorId(id: number, usuario: Usuario): Promise<Reserva> {
    // Un id mayor al máximo no puede existir en la base de datos: respondemos 404
    // en lugar de dejar que la consulta falle con un error 500.
    const reserva =
      id > ID_MAXIMO ? null : await this.reservasRepository.findOneBy({ id });

    // 404: la reserva no existe.
    if (!reserva) {
      throw new NotFoundException(`No existe la reserva con id ${id}`);
    }

    // 403: la reserva existe, pero un recepcionista no puede ver las de otro.
    // Conocer el id no da acceso.
    if (
      usuario.rol === Rol.RECEPCIONISTA &&
      reserva.recepcionista !== usuario.id
    ) {
      throw new ForbiddenException('No tienes acceso a esta reserva');
    }

    return reserva;
  }

  // RN-03: cambiar el estado de una reserva.
  async cambiarEstado(
    id: number,
    dto: CambiarEstadoDto,
    usuario: Usuario,
  ): Promise<Reserva> {
    // Reutilizamos obtenerPorId: así un recepcionista solo puede modificar reservas
    // propias y, si la reserva no existe, se responde 404.
    const reserva = await this.obtenerPorId(id, usuario);
    const estadoActual = reserva.estado;
    const estadoNuevo = dto.estado;

    // Cancelar es exclusivo de admin y coordinador.
    if (
      usuario.rol === Rol.RECEPCIONISTA &&
      estadoNuevo === EstadoReserva.CANCELADA
    ) {
      throw new ForbiddenException(
        'Un recepcionista no puede cancelar reservas',
      );
    }

    // Revisamos si el cambio de estado está en la lista de transiciones permitidas.
    // Esto también rechaza saltar estados y modificar reservas FINALIZADAS o CANCELADAS.
    if (!this.transicionesPermitidas[estadoActual].includes(estadoNuevo)) {
      // 409 Conflict: la petición está bien escrita, pero choca con el estado actual
      // de la reserva. Por eso el mensaje indica el estado actual y el solicitado.
      throw new ConflictException(
        `No se puede cambiar el estado de ${estadoActual} a ${estadoNuevo}`,
      );
    }

    reserva.estado = estadoNuevo;
    // save() actualiza la reserva y TypeORM renueva "actualizadaEn" automáticamente.
    return this.reservasRepository.save(reserva);
  }

  // Decide quién es el recepcionista responsable de la reserva (RN-01).
  private obtenerRecepcionistaResponsable(
    dto: CrearReservaDto,
    usuario: Usuario,
  ): string {
    // Si quien registra es recepcionista, la reserva queda a su nombre
    // y se ignora cualquier valor que haya enviado en el cuerpo.
    if (usuario.rol === Rol.RECEPCIONISTA) {
      return usuario.id;
    }

    // Si es admin o coordinador, debe indicar el recepcionista en el cuerpo.
    if (!dto.recepcionista) {
      throw new BadRequestException(
        'recepcionista es obligatorio cuando registra un admin o un coordinador',
      );
    }

    // Verificamos que ese usuario exista y que de verdad sea recepcionista.
    const responsable = this.usuariosService.buscarPorId(dto.recepcionista);
    if (!responsable || responsable.rol !== Rol.RECEPCIONISTA) {
      throw new BadRequestException(
        `El usuario "${dto.recepcionista}" no existe o no tiene el rol recepcionista`,
      );
    }

    return responsable.id;
  }

  // Valida las reglas de fechas de RN-01.
  private validarFechas(fechaIngreso: string, fechaSalida: string): void {
    // Las fechas tienen el formato AAAA-MM-DD, así que comparar los textos
    // directamente equivale a comparar las fechas.
    if (fechaIngreso < this.obtenerFechaHoy()) {
      throw new BadRequestException('fechaIngreso no puede estar en el pasado');
    }

    if (fechaSalida <= fechaIngreso) {
      throw new BadRequestException(
        'fechaSalida debe ser posterior a fechaIngreso',
      );
    }
  }

  // Devuelve la fecha de hoy como texto AAAA-MM-DD, usando la hora del servidor.
  private obtenerFechaHoy(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    // getMonth() empieza en 0 (enero = 0), por eso sumamos 1.
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
