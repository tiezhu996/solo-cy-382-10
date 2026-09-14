import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtGuard } from '../../common/guards/optional-jwt.guard';
import { TripService } from './trip.service';

@Controller('api/trips')
export class TripController {
  constructor(private readonly service: TripService) {}
  @UseGuards(OptionalJwtGuard)
  @Get() list(@Req() req: any) { return this.service.list(req.user?.userId); }
  @Post() create(@Body() body: any) { return this.service.create(body); }
  @Get('match') match(@Query('destination') destination: string, @Query('date') date: string, @Query('budgetMax') budgetMax: string) { return this.service.match(destination, date, Number(budgetMax)); }
}
