import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { ERROR_CODES } from '../../constants/errors';
import { AppException } from '../../common/errors/app.exception';
import { TripEntity } from '../trip/trip.entity';
import { FavoriteEntity } from './favorite.entity';

@Injectable()
export class FavoriteService {
  private readonly logger = new Logger(FavoriteService.name);

  constructor(
    @InjectRepository(FavoriteEntity) private readonly favorites: Repository<FavoriteEntity>,
    @InjectRepository(TripEntity) private readonly trips: Repository<TripEntity>
  ) {}

  async favorite(userId: number, tripId: number) {
    await this.ensureTripExists(tripId);
    const existing = await this.favorites.findOneBy({ userId, tripId });
    if (existing) return { tripId, favorited: true, favoritedAt: existing.createdAt };
    try {
      const saved = await this.favorites.save(this.favorites.create({ userId, tripId }));
      return { tripId, favorited: true, favoritedAt: saved.createdAt };
    } catch (error) {
      // 并发重复收藏时由唯一索引兜底，结果与首次收藏保持一致
      if (error instanceof QueryFailedError && (error.driverError as { code?: string })?.code === 'ER_DUP_ENTRY') {
        this.logger.warn(`重复收藏已被唯一索引拦截 userId=${userId} tripId=${tripId}`);
        const current = await this.favorites.findOneBy({ userId, tripId });
        return { tripId, favorited: true, favoritedAt: current?.createdAt };
      }
      throw error;
    }
  }

  async unfavorite(userId: number, tripId: number) {
    await this.ensureTripExists(tripId);
    await this.favorites.delete({ userId, tripId });
    return { tripId, favorited: false };
  }

  async listMine(userId: number) {
    const rows = await this.favorites.find({ where: { userId }, order: { createdAt: 'DESC', id: 'DESC' } });
    if (rows.length === 0) return [];
    const trips = await this.trips.findBy({ id: In(rows.map(row => row.tripId)) });
    const tripById = new Map(trips.map(trip => [trip.id, trip]));
    return rows
      .filter(row => tripById.has(row.tripId))
      .map(row => ({ tripId: row.tripId, favorited: true, favoritedAt: row.createdAt, trip: { ...tripById.get(row.tripId)!, favorited: true } }));
  }

  private async ensureTripExists(tripId: number) {
    const trip = await this.trips.findOneBy({ id: tripId });
    if (!trip) throw new AppException(ERROR_CODES.TRIP_NOT_FOUND, '行程不存在', 404);
  }
}
