import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../users/entities/user.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { QueryAdminNewsDto, QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NEWS_CATEGORIES, NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get('categories')
  categories() {
    return NEWS_CATEGORIES;
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAdmin(@Query() query: QueryAdminNewsDto) {
    return this.news.findAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAdminById(@Param('id', ParseIntPipe) id: number) {
    return this.news.findAdminById(id);
  }

  @Get()
  findPublic(@Query() query: QueryNewsDto) {
    return this.news.findPublic(query);
  }

  @Get('slug/:slug')
  findPublicBySlug(@Param('slug') slug: string) {
    return this.news.findPublicBySlug(slug);
  }

  @Get(':id')
  findPublicById(@Param('id', ParseIntPipe) id: number) {
    return this.news.findPublicById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateNewsDto) {
    return this.news.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNewsDto) {
    return this.news.update(id, dto);
  }

  @Post(':id/publish')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.news.setPublication(id, true);
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  unpublish(@Param('id', ParseIntPipe) id: number) {
    return this.news.setPublication(id, false);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.news.remove(id);
  }
}
