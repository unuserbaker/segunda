import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('brands')
export class Brand {
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

  @OneToMany(() => Vehicle, (vehicle) => vehicle.brand)
  vehicles!: Vehicle[];
}
