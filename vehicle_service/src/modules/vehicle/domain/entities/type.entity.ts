import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('types')
export class Type {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 60 })
  name!: string;

  @Column({ length: 50 })
  str_code!: string;

  @Column({ default: false })
  active!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
