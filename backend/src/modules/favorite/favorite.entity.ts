import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('trip_favorites')
@Unique('uk_trip_favorite', ['userId', 'tripId'])
export class FavoriteEntity {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ name: 'user_id' }) userId!: number;
  @Column({ name: 'trip_id' }) tripId!: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
