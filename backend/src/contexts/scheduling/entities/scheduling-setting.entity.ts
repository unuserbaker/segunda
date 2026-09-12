import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'scheduling', name: 'settings' })
export class SchedulingSetting {
  @PrimaryColumn({ length: 100 })
  key!: string;

  @Column({ length: 255 })
  value!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
