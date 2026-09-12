import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ schema: 'scheduling', name: 'dispute_notes' })
export class DisputeNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  appointment_id!: string;

  @Column({ type: 'uuid' })
  author_id!: string;

  @Column({ type: 'text' })
  note!: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
