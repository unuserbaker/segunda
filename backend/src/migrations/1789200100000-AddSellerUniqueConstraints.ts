import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerUniqueConstraints1789200100000 implements MigrationInterface {
  name = 'AddSellerUniqueConstraints1789200100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Dedupe safety net: si existieran filas legacy con tax_id duplicado o user_id
    // duplicado, la creación de estas constraints fallaría. No se espera que existan hoy
    // (tabla nueva, sin registro self-service previo), pero se documenta la intención
    // para quien corra esta migración contra una DB con datos.
    //
    // Nota: un UNIQUE constraint estándar de Postgres ya permite múltiples filas con
    // `tax_id IS NULL` (los NULL nunca se consideran iguales entre sí), por lo que no
    // hace falta un índice parcial `WHERE tax_id IS NOT NULL` custom. Esto además
    // coincide con `@Column({ unique: true, nullable: true })` en `seller.entity.ts`,
    // que es lo que `synchronize: true` generaría en dev.
    await queryRunner.query(
      `ALTER TABLE "sellers"."sellers" ADD CONSTRAINT "UQ_sellers_tax_id" UNIQUE ("tax_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers"."sellers" ADD CONSTRAINT "UQ_sellers_user_id" UNIQUE ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sellers"."sellers" DROP CONSTRAINT "UQ_sellers_user_id"`);
    await queryRunner.query(`ALTER TABLE "sellers"."sellers" DROP CONSTRAINT "UQ_sellers_tax_id"`);
  }
}
