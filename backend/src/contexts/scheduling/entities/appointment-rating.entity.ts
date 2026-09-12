import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Check,
  Index,
} from 'typeorm';

@Entity({ schema: 'scheduling', name: 'appointment_ratings' })
@Unique(['appointment_id', 'rater_role'])
@Check(`"stars" BETWEEN 1 AND 5`)
export class AppointmentRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  appointment_id!: string;

  @Column({ length: 10 })
  rater_role!: 'seller' | 'buyer';

  @Column({ type: 'smallint' })
  stars!: number;

  @Column({ length: 50 })
  label!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
