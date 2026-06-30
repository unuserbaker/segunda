import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'scheduling', name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  vehicle_id!: string;

  @Column({ type: 'uuid' })
  seller_id!: string;

  @Column({ type: 'uuid' })
  buyer_id!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ length: 10 })
  time_slot!: string;

  @Column({ length: 20, default: 'pending' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
