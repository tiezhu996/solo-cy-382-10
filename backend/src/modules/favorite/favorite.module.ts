import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { TripEntity } from '../trip/trip.entity';
import { FavoriteController } from './favorite.controller';
import { FavoriteEntity } from './favorite.entity';
import { FavoriteService } from './favorite.service';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity, TripEntity]), JwtModule.register({ secret: process.env.JWT_SECRET ?? 'dev_secret' })],
  controllers: [FavoriteController],
  providers: [FavoriteService, JwtGuard]
})
export class FavoriteModule {}
