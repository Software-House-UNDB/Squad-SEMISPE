import {
  Body,
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserAccessGuard } from '../auth/guards/user-access.guard';
import { Role } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UsersService } from './users.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  profile(@Req() request: { user: AuthenticatedUser }) {
    return this.usersService.findOne(request.user.userId);
  }

  @Patch('me')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() request: { user: AuthenticatedUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.update(request.user.userId, dto);
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard, UserAccessGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard, UserAccessGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() request: { user: AuthenticatedUser },
  ) {
    if (
      (request.user.role !== Role.ADMIN || request.user.userId === id) &&
      (dto.name !== undefined || dto.cpf !== undefined)
    ) {
      throw new BadRequestException(
        'Nome e CPF não podem ser alterados pela própria conta.',
      );
    }
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, UserAccessGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
