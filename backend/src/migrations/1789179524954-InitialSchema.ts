import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789179524954 implements MigrationInterface {
    name = 'InitialSchema1789179524954'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vehicles"."brands" ("id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "str_code" character varying(50) NOT NULL, "active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles"."categories" ("id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "str_code" character varying(50) NOT NULL, "active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles"."engine_types" ("id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "str_code" character varying(50) NOT NULL, "active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cd5ba60fb52bc6ab1912d3aa6b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles"."transmissions" ("id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "str_code" character varying(50) NOT NULL, "active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c4fa2c4c7bc20d6592041cc02f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles"."types" ("id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "str_code" character varying(50) NOT NULL, "active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_33b81de5358589c738907c3559b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles"."status" ("id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "str_code" character varying(50) NOT NULL, "active" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e12743a7086ec826733f54e1d95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles"."vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "category_id" integer, "brand_id" integer, "price" numeric(15,2) NOT NULL, "mileage" integer NOT NULL, "plate" character varying(10) NOT NULL, "engine_type_id" integer, "transmission_id" integer, "type_id" integer, "status_id" integer, "seller_id" uuid, "year" integer, "color" character varying(50), "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE ("plate"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sellers"."sellers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "business_name" character varying(200) NOT NULL, "tax_id" character varying(50), "phone" character varying(20), "verified" boolean NOT NULL DEFAULT false, "verified_by" uuid, "verified_at" TIMESTAMP WITH TIME ZONE, "rating" numeric(2,1) NOT NULL DEFAULT '0', "total_sales" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_97337ccbf692c58e6c7682de8a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "scheduling"."appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "vehicle_id" uuid NOT NULL, "seller_id" uuid NOT NULL, "buyer_id" uuid NOT NULL, "date" date NOT NULL, "time_slot" character varying(10) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "iam"."users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(100) NOT NULL, "password" character varying NOT NULL, "name" character varying(100) NOT NULL, "role" character varying(20) NOT NULL DEFAULT 'buyer', "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "iam"."internal_staff" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "role" character varying(10) NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_d248bedb4cc6d5e34b03572fee9" UNIQUE ("user_id"), CONSTRAINT "PK_01795d4af795a361ffa74d5180b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" ADD CONSTRAINT "FK_73799befe8cf03cf49595d96d6d" FOREIGN KEY ("brand_id") REFERENCES "vehicles"."brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" ADD CONSTRAINT "FK_7c9c01029cf86e5b8fd281983fa" FOREIGN KEY ("category_id") REFERENCES "vehicles"."categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" ADD CONSTRAINT "FK_988ba5f4794220505ecd4776e1b" FOREIGN KEY ("engine_type_id") REFERENCES "vehicles"."engine_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" ADD CONSTRAINT "FK_b61e232ce66fd9d516516cea182" FOREIGN KEY ("transmission_id") REFERENCES "vehicles"."transmissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" ADD CONSTRAINT "FK_218aae238bdeffb5b71b8c82c02" FOREIGN KEY ("type_id") REFERENCES "vehicles"."types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" ADD CONSTRAINT "FK_87906f18cf3fc45db9dbb154b3d" FOREIGN KEY ("status_id") REFERENCES "vehicles"."status"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" DROP CONSTRAINT "FK_87906f18cf3fc45db9dbb154b3d"`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" DROP CONSTRAINT "FK_218aae238bdeffb5b71b8c82c02"`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" DROP CONSTRAINT "FK_b61e232ce66fd9d516516cea182"`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" DROP CONSTRAINT "FK_988ba5f4794220505ecd4776e1b"`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" DROP CONSTRAINT "FK_7c9c01029cf86e5b8fd281983fa"`);
        await queryRunner.query(`ALTER TABLE "vehicles"."vehicles" DROP CONSTRAINT "FK_73799befe8cf03cf49595d96d6d"`);
        await queryRunner.query(`DROP TABLE "iam"."internal_staff"`);
        await queryRunner.query(`DROP TABLE "iam"."users"`);
        await queryRunner.query(`DROP TABLE "scheduling"."appointments"`);
        await queryRunner.query(`DROP TABLE "sellers"."sellers"`);
        await queryRunner.query(`DROP TABLE "vehicles"."vehicles"`);
        await queryRunner.query(`DROP TABLE "vehicles"."status"`);
        await queryRunner.query(`DROP TABLE "vehicles"."types"`);
        await queryRunner.query(`DROP TABLE "vehicles"."transmissions"`);
        await queryRunner.query(`DROP TABLE "vehicles"."engine_types"`);
        await queryRunner.query(`DROP TABLE "vehicles"."categories"`);
        await queryRunner.query(`DROP TABLE "vehicles"."brands"`);
    }

}
