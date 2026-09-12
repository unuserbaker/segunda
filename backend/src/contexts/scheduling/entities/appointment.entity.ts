import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * `scheduling` no importa `Repository<Vehicle>`/`Repository<Seller>`/`Repository<User>` para
 * lógica de negocio (usa `VehiclesService`/`IamService` exportados). Se omiten los decoradores
 * `@ManyToOne` hacia esas entidades para mantener el aislamiento de módulos Nest; la integridad
 * referencial (FK real a nivel SQL) se agrega en la migración explícita, no en la entidad.
 */
@Entity({ schema: 'scheduling', name: 'appointments' })
@Index(['vehicle_id', 'status'])
@Index(['status', 'release_at'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  vehicle_id!: string;

  @Column({ type: 'uuid' })
  seller_id!: string;

  @Column({ type: 'uuid' })
  buyer_id!: string;

  @Column({ type: 'timestamptz' })
  scheduled_at!: Date;

  @Column({ length: 30, default: 'agendada' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  rsvp_confirmed_at!: Date | null;

  @Column({ type: 'timestamptz' })
  release_at!: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  seller_result!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  seller_result_at!: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customer_result!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  customer_result_at!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer_result_token!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  customer_result_token_expires_at!: Date | null;

  @Column({ default: false })
  is_disputed!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
