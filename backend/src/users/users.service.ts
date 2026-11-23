import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const SALT_ROUNDS = 10;

interface MysqlDuplicateEntryError {
  code: string;
  sqlMessage?: string;
  message: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.usersRepository.create({ ...dto, password });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      this.rethrowAsConflict(error);
    }
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({
      email: email.trim().toLowerCase(),
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const password = dto.password
      ? await bcrypt.hash(dto.password, SALT_ROUNDS)
      : undefined;

    try {
      return await this.usersRepository.manager.transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user) throw new NotFoundException(`User with id ${id} not found`);
        const changes = Object.fromEntries(
          Object.entries(dto).filter(
            ([key, value]) => key !== 'password' && value !== undefined,
          ),
        );
        Object.assign(user, changes);
        if (password) {
          user.password = password;
          user.tokenVersion++;
        }
        return manager.save(User, user);
      });
    } catch (error) {
      this.rethrowAsConflict(error);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.usersRepository.delete(id);
      if (result.affected === 0)
        throw new NotFoundException(`User with id ${id} not found`);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code ===
          'ER_ROW_IS_REFERENCED_2'
      ) {
        throw new ConflictException(
          'A conta possui ideias vinculadas e não pode ser excluída. O histórico precisa ser preservado.',
        );
      }
      throw error;
    }
  }

  private rethrowAsConflict(error: unknown): never {
    if (error instanceof QueryFailedError) {
      const driverError = error.driverError as
        MysqlDuplicateEntryError | undefined;
      if (driverError?.code === 'ER_DUP_ENTRY') {
        const message = driverError.sqlMessage ?? driverError.message;

        if (message.includes('UQ_users_email')) {
          throw new ConflictException(
            'Já existe um usuário cadastrado com este e-mail.',
          );
        }
        if (message.includes('UQ_users_cpf')) {
          throw new ConflictException(
            'Já existe um usuário cadastrado com este CPF.',
          );
        }
        if (message.includes('UQ_users_cnpj')) {
          throw new ConflictException(
            'Já existe um usuário cadastrado com este CNPJ.',
          );
        }
        throw new ConflictException(
          'Dado duplicado: já existe um registro com esse valor.',
        );
      }
    }

    throw error;
  }
}
