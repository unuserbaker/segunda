import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('transmissions')
export class Transmission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 60 })
  name!: string;

  @Column({ length: 50 })
  str_code!: string;

  @Column({ default: false })
  active!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
