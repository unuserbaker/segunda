import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerUniqueConstraints1789200100000 implements MigrationInterface {
  name = 'AddSellerUniqueConstraints1789200100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Dedupe safety net: si existieran filas legacy con tax_id duplicado o user_id
    // duplicado, la creación de estos índices fallaría. No se espera que existan hoy
    // (tabla nueva, sin registro self-service previo), pero se documenta la intención
    // para quien corra esta migración contra una DB con datos.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_sellers_tax_id" ON "sellers"."sellers" ("tax_id") WHERE "tax_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sellers"."sellers" ADD CONSTRAINT "UQ_sellers_user_id" UNIQUE ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sellers"."sellers" DROP CONSTRAINT "UQ_sellers_user_id"`);
    await queryRunner.query(`DROP INDEX "sellers"."UQ_sellers_tax_id"`);
  }
}
