import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerifiedAtToUsers1789181485138 implements MigrationInterface {
    name = 'AddEmailVerifiedAtToUsers1789181485138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "scheduling"."settings" ("key" character varying(100) NOT NULL, "value" character varying(255) NOT NULL, "description" text, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c8639b7626fa94ba8265628f214" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "scheduling"."dispute_notes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointment_id" uuid NOT NULL, "author_id" uuid NOT NULL, "note" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_12c264679d2c3abe161f0f04c9b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c7627211ba978976b4814d3baa" ON "scheduling"."dispute_notes" ("appointment_id") `);
        await queryRunner.query(`CREATE TABLE "scheduling"."business_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_type" character varying(50) NOT NULL, "entity_type" character varying(20) NOT NULL, "entity_id" uuid NOT NULL, "payload" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_29846e77bc2ec05a8478037d61b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9b8aa5c5a489052aa66c5041d5" ON "scheduling"."business_events" ("event_type", "created_at") `);
        await queryRunner.query(`CREATE TABLE "scheduling"."appointment_ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointment_id" uuid NOT NULL, "rater_role" character varying(10) NOT NULL, "stars" smallint NOT NULL, "label" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f14e99dbd6ed71946bd9de2eee0" UNIQUE ("appointment_id", "rater_role"), CONSTRAINT "CHK_6953956ad68482df77e5cd9f9e" CHECK ("stars" BETWEEN 1 AND 5), CONSTRAINT "PK_46dcba0c9a090c875eea6491386" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4d15e952c3fe717dfb7ac9db24" ON "scheduling"."appointment_ratings" ("appointment_id") `);
        await queryRunner.query(`CREATE TABLE "iam"."email_verifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "consumed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1ea2921e767f83cd44c0af203f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_595be4c36e66b21d3fd14c73a2" ON "iam"."email_verifications" ("token") `);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "date"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "time_slot"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "scheduled_at" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "rsvp_confirmed_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "release_at" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "seller_result" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "seller_result_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "customer_result" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "customer_result_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "customer_result_token" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "customer_result_token_expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "is_disputed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "iam"."users" ADD "email_verified_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "status" character varying(30) NOT NULL DEFAULT 'agendada'`);
        await queryRunner.query(`CREATE INDEX "IDX_4c319102b0bb1fb2482de6283e" ON "scheduling"."appointments" ("status", "release_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_4a5c81337caf5720ea91550568" ON "scheduling"."appointments" ("vehicle_id", "status") `);
        await queryRunner.query(`ALTER TABLE "iam"."email_verifications" ADD CONSTRAINT "FK_c4f1838323ae1dff5aa00148915" FOREIGN KEY ("user_id") REFERENCES "iam"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // FKs cross-schema añadidas a mano (docs-db-spec-mes1-scheduling.md sección 3.3): la tabla
        // está vacía en todos los ambientes de dev, por lo que es seguro agregarlas sin migración
        // de backfill. `scheduling` no declara `@ManyToOne` en la entidad (aislamiento de módulos),
        // el FK vive solo a nivel de constraint SQL.
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD CONSTRAINT "FK_appointments_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"."vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD CONSTRAINT "FK_appointments_seller_id" FOREIGN KEY ("seller_id") REFERENCES "sellers"."sellers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD CONSTRAINT "FK_appointments_buyer_id" FOREIGN KEY ("buyer_id") REFERENCES "iam"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointment_ratings" ADD CONSTRAINT "FK_appointment_ratings_appointment_id" FOREIGN KEY ("appointment_id") REFERENCES "scheduling"."appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scheduling"."dispute_notes" ADD CONSTRAINT "FK_dispute_notes_appointment_id" FOREIGN KEY ("appointment_id") REFERENCES "scheduling"."appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "scheduling"."dispute_notes" DROP CONSTRAINT "FK_dispute_notes_appointment_id"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointment_ratings" DROP CONSTRAINT "FK_appointment_ratings_appointment_id"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP CONSTRAINT "FK_appointments_buyer_id"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP CONSTRAINT "FK_appointments_seller_id"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP CONSTRAINT "FK_appointments_vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "iam"."email_verifications" DROP CONSTRAINT "FK_c4f1838323ae1dff5aa00148915"`);
        await queryRunner.query(`DROP INDEX "scheduling"."IDX_4a5c81337caf5720ea91550568"`);
        await queryRunner.query(`DROP INDEX "scheduling"."IDX_4c319102b0bb1fb2482de6283e"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "status"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "status" character varying(20) NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "iam"."users" DROP COLUMN "email_verified_at"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "is_disputed"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "customer_result_token_expires_at"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "customer_result_token"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "customer_result_at"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "customer_result"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "seller_result_at"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "seller_result"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "release_at"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "rsvp_confirmed_at"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" DROP COLUMN "scheduled_at"`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "time_slot" character varying(10) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "scheduling"."appointments" ADD "date" date NOT NULL`);
        await queryRunner.query(`DROP INDEX "iam"."IDX_595be4c36e66b21d3fd14c73a2"`);
        await queryRunner.query(`DROP TABLE "iam"."email_verifications"`);
        await queryRunner.query(`DROP INDEX "scheduling"."IDX_4d15e952c3fe717dfb7ac9db24"`);
        await queryRunner.query(`DROP TABLE "scheduling"."appointment_ratings"`);
        await queryRunner.query(`DROP INDEX "scheduling"."IDX_9b8aa5c5a489052aa66c5041d5"`);
        await queryRunner.query(`DROP TABLE "scheduling"."business_events"`);
        await queryRunner.query(`DROP INDEX "scheduling"."IDX_c7627211ba978976b4814d3baa"`);
        await queryRunner.query(`DROP TABLE "scheduling"."dispute_notes"`);
        await queryRunner.query(`DROP TABLE "scheduling"."settings"`);
    }

}
