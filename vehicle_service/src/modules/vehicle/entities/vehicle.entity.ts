import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Brand } from './brand.entity';
import { Category } from './category.entity';
import { EngineType } from './engine_type.entity';
import { Transmission } from './transmission.entity';
import { Type } from './type.entity';
import { Status } from './status.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  category_id!: number;

  @Column({ nullable: true })
  brand_id!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  price!: number;

  @Column()
  mileage!: number;

  @Column({ length: 10, unique: true })
  plate!: string;

  @Column({ nullable: true })
  engine_type_id!: number;

  @Column({ nullable: true })
  transmission_id!: number;

  @Column({ nullable: true })
  type_id!: number;

  @Column({ nullable: true })
  status_id!: number;

  @Column({ type: 'uuid', nullable: true })
  seller_id!: string;

  @Column({ nullable: true })
  year!: number;

  @Column({ nullable: true, length: 50 })
  color!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @ManyToOne(() => Brand, (brand) => brand.vehicles)
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @ManyToOne(() => EngineType)
  @JoinColumn({ name: 'engine_type_id' })
  engineType!: EngineType;

  @ManyToOne(() => Transmission)
  @JoinColumn({ name: 'transmission_id' })
  transmission!: Transmission;

  @ManyToOne(() => Type)
  @JoinColumn({ name: 'type_id' })
  type!: Type;

  @ManyToOne(() => Status)
  @JoinColumn({ name: 'status_id' })
  status!: Status;
}
