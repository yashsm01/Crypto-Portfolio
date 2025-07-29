import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { Portfolio } from './entities/portfolio.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('portfolio')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new cryptocurrency to portfolio' })
  @ApiResponse({
    status: 201,
    description: 'The crypto has been successfully added.',
    type: Portfolio,
  })
  create(@Request() req, @Body() createPortfolioDto: CreatePortfolioDto) {
    return this.portfolioService.create(createPortfolioDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all portfolio entries with current prices' })
  @ApiResponse({
    status: 200,
    description: 'Return all portfolio entries.',
    type: [Portfolio],
  })
  findAll(@Request() req) {
    return this.portfolioService.findAll(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a portfolio entry' })
  @ApiParam({
    name: 'id',
    description: 'Portfolio entry ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'The crypto has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio entry not found.',
  })
  remove(@Request() req, @Param('id') id: string) {
    return this.portfolioService.remove(+id, req.user.id);
  }
} 