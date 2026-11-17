import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Space, SpaceState } from '../spaces/entities/space.entity';
import { SpacesService } from '../spaces/spaces.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationAttachment } from './entities/reservation-attachment.entity';
import {
  RequesterType,
  Reservation,
  ReservationStatus,
} from './entities/reservation.entity';
import { ReservationFiles, validateFiles } from './reservation-files';
import { ReservationsService } from './reservations.service';

export const validReservation = (): CreateReservationDto => ({
  requester: {
    name: 'Maria Silva',
    email: 'maria@example.com',
    phone: '98999999999',
    type: RequesterType.PERSON,
    institution: null,
    document: '52998224725',
  },
  spaceId: 1,
  date: '2099-06-10',
  startTime: '09:00',
  endTime: '10:00',
  participants: 10,
  eventType: 'Reunião',
  equipment: ['Projetor'],
  needsItSupport: false,
  subject: 'Reunião de planejamento',
  consent: true,
});

export const validFiles = (): ReservationFiles => ({
  oficio: [
    {
      originalname: 'oficio.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nexample'),
      size: Buffer.byteLength('%PDF-1.4\nexample'),
    },
  ],
});

describe('ReservationsService', () => {
  const space = Object.assign(new Space(), {
    id: 1,
    capacity: 30,
    equipment: ['Projetor'],
    state: SpaceState.ACTIVE,
  });
  let service: ReservationsService;
  let record: Reservation;
  let lockedSpace: Space;
  const reservations = {
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const attachments = { findOne: jest.fn(), find: jest.fn() };
  const spaces = { findOne: jest.fn() };
  const qb = {
    where: jest.fn(),
    andWhere: jest.fn(),
    setLock: jest.fn(),
    getOne: jest.fn(),
  };
  const manager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const source = { transaction: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    lockedSpace = { ...space };
    record = Object.assign(new Reservation(), validReservation(), {
      id: 10,
      status: ReservationStatus.PENDING,
    });
    reservations.findOneBy.mockResolvedValue(record);
    spaces.findOne.mockResolvedValue(space);
    manager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(entity === Space ? lockedSpace : record),
    );
    manager.create.mockImplementation((_entity: unknown, data: object) => data);
    manager.save.mockImplementation((entity: unknown, data: object) =>
      Promise.resolve(
        entity === Reservation
          ? { ...data, id: 10, createdAt: new Date() }
          : data,
      ),
    );
    Object.values(qb).forEach((fn) => fn.mockReturnValue(qb));
    qb.getOne.mockResolvedValue(null);
    manager.createQueryBuilder.mockReturnValue(qb);
    source.transaction.mockImplementation(
      (callback: (em: EntityManager) => unknown) =>
        callback(manager as unknown as EntityManager),
    );
    service = new ReservationsService(
      reservations as unknown as Repository<Reservation>,
      attachments as unknown as Repository<ReservationAttachment>,
      spaces as unknown as SpacesService,
      source as unknown as DataSource,
    );
  });

  it('salva pedido pendente e anexos na mesma transação sem expor dados pessoais', async () => {
    const response = await service.create(validReservation(), validFiles());
    expect(response).toEqual({
      id: 10,
      status: ReservationStatus.PENDING,
      createdAt: expect.any(Date) as unknown,
    });
    expect(spaces.findOne).toHaveBeenCalledWith(1);
    expect(manager.findOne).toHaveBeenCalledWith(Space, {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.save).toHaveBeenCalledWith(ReservationAttachment, [
      expect.objectContaining({
        reservationId: 10,
        kind: 'oficio',
        content: expect.any(Buffer) as unknown,
      }),
    ]);
  });

  it.each([
    { startTime: '11:00', endTime: '10:00' },
    { startTime: '09:00', endTime: '09:00' },
    { date: '2020-01-01' },
  ])('rejeita período inválido %j', async (change) => {
    await expect(
      service.create({ ...validReservation(), ...change }, validFiles()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(source.transaction).not.toHaveBeenCalled();
  });

  it.each(['11111111111', '52998224724', '11222333000181'])(
    'rejeita CPF inválido ou CNPJ para pessoa física: %s',
    async (document) => {
      const dto = validReservation();
      dto.requester.document = document;
      await expect(service.create(dto, validFiles())).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );

  it('aceita CNPJ com dígitos verificadores válidos para instituição', async () => {
    const dto = validReservation();
    dto.requester = {
      ...dto.requester,
      type: RequesterType.INSTITUTION,
      institution: 'Instituição',
      document: '11222333000181',
    };
    await expect(service.create(dto, validFiles())).resolves.toMatchObject({
      status: 'pending',
    });
  });

  it.each([{ state: SpaceState.INACTIVE }, { capacity: 5 }, { equipment: [] }])(
    'valida o estado atual do espaço na transação %j',
    async (change) => {
      lockedSpace = { ...space, ...change };
      await expect(
        service.create(validReservation(), validFiles()),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(manager.save).not.toHaveBeenCalled();
    },
  );

  it('retorna 404 para espaço inexistente', async () => {
    spaces.findOne.mockRejectedValue(new NotFoundException());
    await expect(
      service.create(validReservation(), validFiles()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('impede sobreposição com aprovado, incluindo na aprovação', async () => {
    qb.getOne.mockResolvedValue({ id: 20 });
    await expect(
      service.create(validReservation(), validFiles()),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.review(10, { status: ReservationStatus.APPROVED }, 7),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.save).not.toHaveBeenCalled();
    expect(qb.andWhere).toHaveBeenCalledWith('reservation.status = :status', {
      status: ReservationStatus.APPROVED,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'reservation.startTime < :endTime AND reservation.endTime > :startTime',
      { startTime: '09:00', endTime: '10:00' },
    );
    expect(qb.setLock).toHaveBeenCalledWith('pessimistic_write');
  });

  it('aprova e registra administrador, nota e data da análise', async () => {
    await expect(
      service.review(
        10,
        { status: ReservationStatus.APPROVED, reviewNote: 'Autorizado' },
        7,
      ),
    ).resolves.toMatchObject({
      status: 'approved',
      reviewedBy: 7,
      reviewNote: 'Autorizado',
      reviewedAt: expect.any(Date) as unknown,
    });
    expect(
      manager.findOne.mock.calls.map(([entity]) => entity as unknown),
    ).toEqual([Space, Reservation]);
  });

  it('não permite reanalisar uma reserva aprovada', async () => {
    record.status = ReservationStatus.APPROVED;
    await expect(
      service.review(10, { status: ReservationStatus.REJECTED }, 7),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('permite cancelar uma aprovada para liberar a agenda', async () => {
    record.status = ReservationStatus.APPROVED;
    await expect(
      service.review(10, { status: ReservationStatus.CANCELLED }, 7),
    ).resolves.toMatchObject({ status: 'cancelled' });
    expect(qb.getOne).not.toHaveBeenCalled();
  });

  it('rejeita pendente sem exigir que o espaço continue ativo', async () => {
    lockedSpace.state = SpaceState.INACTIVE;
    await expect(
      service.review(10, { status: ReservationStatus.REJECTED }, 7),
    ).resolves.toMatchObject({ status: 'rejected' });
  });

  it('revalida capacidade e data na aprovação', async () => {
    lockedSpace.capacity = 1;
    await expect(
      service.review(10, { status: ReservationStatus.APPROVED }, 7),
    ).rejects.toBeInstanceOf(BadRequestException);
    lockedSpace.capacity = 30;
    record.date = '2020-01-01';
    await expect(
      service.review(10, { status: ReservationStatus.APPROVED }, 7),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('limita download ao anexo da reserva indicada', async () => {
    attachments.findOne.mockResolvedValue(null);
    await expect(service.download(10, 50)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(attachments.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 50, reservationId: 10 } }),
    );
  });

  it('agenda pública seleciona apenas horários aprovados', async () => {
    reservations.find.mockResolvedValue([
      { startTime: '09:00:00', endTime: '10:00:00' },
    ]);
    expect(await service.schedule(1, '2099-06-10')).toEqual({
      spaceId: 1,
      date: '2099-06-10',
      active: true,
      occupied: [{ startTime: '09:00:00', endTime: '10:00:00' }],
    });
    expect(reservations.find).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { startTime: true, endTime: true },
        where: { spaceId: 1, date: '2099-06-10', status: 'approved' },
      }),
    );
  });

  it('propaga falha dos anexos para rollback da transação', async () => {
    manager.save.mockImplementation((entity: unknown, data: object) =>
      entity === ReservationAttachment
        ? Promise.reject(new Error('DB failure'))
        : Promise.resolve({ ...data, id: 10 }),
    );
    await expect(
      service.create(validReservation(), validFiles()),
    ).rejects.toThrow('DB failure');
  });

  it('resume o histórico com contagens numéricas e zero nos status ausentes', async () => {
    const summaryQuery = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { status: 'pending', count: '3' },
        { status: 'approved', count: '2' },
      ]),
    };
    reservations.createQueryBuilder.mockReturnValue(summaryQuery);
    expect(await service.summary()).toEqual({
      pending: 3,
      approved: 2,
      rejected: 0,
      cancelled: 0,
      total: 5,
    });
    expect(summaryQuery.groupBy).toHaveBeenCalledWith('reservation.status');
  });

  it('inclui sala na listagem e preserva filtros e paginação', async () => {
    reservations.findAndCount.mockResolvedValue([[{ ...record, space }], 21]);
    const result = await service.findAll({
      page: 2,
      limit: 10,
      status: ReservationStatus.PENDING,
    });
    expect(result).toMatchObject({
      total: 21,
      page: 2,
      limit: 10,
      items: [{ space }],
    });
    expect(reservations.findAndCount).toHaveBeenCalledWith({
      where: { status: 'pending' },
      relations: { space: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: 10,
      take: 10,
    });
  });
});

describe('anexos', () => {
  it('exige ofício', () => {
    expect(() => validateFiles({})).toThrow(BadRequestException);
  });
  it('rejeita extensão permitida com assinatura falsa', () => {
    const files = validFiles();
    files.oficio![0].buffer = Buffer.from('<script>');
    expect(() => validateFiles(files)).toThrow(BadRequestException);
  });
  it('rejeita extensão não aceita, arquivo vazio e tamanho excessivo', () => {
    for (const change of [
      { originalname: 'oficio.exe' },
      { buffer: Buffer.alloc(0), size: 0 },
      { size: 11 * 1024 * 1024 },
    ]) {
      const files = validFiles();
      Object.assign(files.oficio![0], change);
      expect(() => validateFiles(files)).toThrow(BadRequestException);
    }
  });
});
