import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ schema: 'scheduling', name: 'business_events' })
@Index(['event_type', 'created_at'])
export class BusinessEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  event_type!: string;

  @Column({ length: 20 })
  entity_type!: string;

  @Column({ type: 'uuid' })
  entity_id!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
