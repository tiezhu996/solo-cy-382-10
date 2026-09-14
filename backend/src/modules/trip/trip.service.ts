import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { FavoriteEntity } from '../favorite/favorite.entity';
import { TripEntity } from './trip.entity';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(TripEntity) private readonly trips: Repository<TripEntity>,
    @InjectRepository(FavoriteEntity) private readonly favorites: Repository<FavoriteEntity>
  ) {}
  create(input: Partial<TripEntity>) { return this.trips.save(this.trips.create(input)); }
  async list(userId?: number) {
    const trips = await this.trips.find({ order: { departDate: 'ASC' } });
    if (!userId || trips.length === 0) return trips.map(trip => ({ ...trip, favorited: false }));
    const favorites = await this.favorites.find({ where: { userId, tripId: In(trips.map(trip => trip.id)) } });
    const favoritedIds = new Set(favorites.map(favorite => favorite.tripId));
    return trips.map(trip => ({ ...trip, favorited: favoritedIds.has(trip.id) }));
  }
  match(destination: string, date: string, budgetMax: number) {
    return this.trips.find({ where: { destination, departDate: Between(date, date), budgetMax } });
  }
}
