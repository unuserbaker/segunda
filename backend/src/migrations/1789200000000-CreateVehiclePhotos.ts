import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehiclePhotos1789200000000 implements MigrationInterface {
  name = 'CreateVehiclePhotos1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "files"."vehicle_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle_id" uuid NOT NULL, "storage_key" character varying(500) NOT NULL, "position" smallint NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_vehicle_photos_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "files"."vehicle_photos" ADD CONSTRAINT "FK_vehicle_photos_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"."vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_vehicle_photos_vehicle_id" ON "files"."vehicle_photos" ("vehicle_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "files"."IDX_vehicle_photos_vehicle_id"`);
    await queryRunner.query(
      `ALTER TABLE "files"."vehicle_photos" DROP CONSTRAINT "FK_vehicle_photos_vehicle_id"`,
    );
    await queryRunner.query(`DROP TABLE "files"."vehicle_photos"`);
  }
}
