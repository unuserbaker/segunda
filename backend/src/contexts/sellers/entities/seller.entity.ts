import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'sellers', name: 'sellers' })
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ length: 200 })
  business_name!: string;

  @Column({ length: 50, nullable: true })
  tax_id!: string;

  @Column({ length: 20, nullable: true })
  phone!: string;

  @Column({ default: false })
  verified!: boolean;

  @Column('decimal', { precision: 2, scale: 1, default: 0 })
  rating!: number;

  @Column({ default: 0 })
  total_sales!: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
