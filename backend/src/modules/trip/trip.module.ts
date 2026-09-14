import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OptionalJwtGuard } from '../../common/guards/optional-jwt.guard';
import { FavoriteEntity } from '../favorite/favorite.entity';
import { TripController } from './trip.controller';
import { TripEntity } from './trip.entity';
import { TripService } from './trip.service';

@Module({
  imports: [TypeOrmModule.forFeature([TripEntity, FavoriteEntity]), JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev_secret' })],
  controllers: [TripController],
  providers: [TripService, OptionalJwtGuard]
})
export class TripModule {}
