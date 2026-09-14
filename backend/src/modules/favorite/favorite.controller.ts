import { Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { FavoriteService } from './favorite.service';

@Controller('api')
@UseGuards(JwtGuard)
export class FavoriteController {
  constructor(private readonly service: FavoriteService) {}
  @Post('trips/:id/favorite') favorite(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.service.favorite(req.user.userId, id); }
  @Delete('trips/:id/favorite') unfavorite(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.service.unfavorite(req.user.userId, id); }
  @Get('favorites') mine(@Req() req: any) { return this.service.listMine(req.user.userId); }
}
