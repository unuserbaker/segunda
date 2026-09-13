import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { User } from '../src/contexts/iam/entities/user.entity';
import { InternalStaff } from '../src/contexts/iam/entities/internal-staff.entity';
import { Seller } from '../src/contexts/sellers/entities/seller.entity';
import { Vehicle } from '../src/contexts/vehicles/entities/vehicle.entity';

/**
 * Estos tests e2e corren contra la base Postgres real de desarrollo
 * (misma que usa `npm run start:dev`, ver backend/.env: 127.0.0.1:5433).
 * Requieren que el contenedor `vehicles_db` (docker-compose) esté arriba.
 * Los datos creados por los tests se limpian en afterAll.
 */
describe('App e2e (vehicles / sellers / internal staff)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let staffRepo: Repository<InternalStaff>;
  let sellerRepo: Repository<Seller>;
  let vehicleRepo: Repository<Vehicle>;

  const createdUserIds: string[] = [];
  const createdStaffIds: string[] = [];
  const createdSellerIds: string[] = [];
  const createdVehiclePlates: string[] = [];

  let buyerToken: string;
  let adminToken: string;
  let asesorToken: string;
  let operadorToken: string;
  let sellerIdForVerify: string;

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    staffRepo = moduleFixture.get<Repository<InternalStaff>>(getRepositoryToken(InternalStaff));
    sellerRepo = moduleFixture.get<Repository<Seller>>(getRepositoryToken(Seller));
    vehicleRepo = moduleFixture.get<Repository<Vehicle>>(getRepositoryToken(Vehicle));

    const hashed = await bcrypt.hash('Password123', 10);
    const suffix = Date.now();

    // buyer normal (sin internalRole)
    const buyer = await userRepo.save(
      userRepo.create({
        email: `qa-buyer-${suffix}@test.com`,
        password: hashed,
        name: 'QA Buyer',
        role: 'buyer',
      }),
    );
    createdUserIds.push(buyer.id);

    // admin interno
    const adminUser = await userRepo.save(
      userRepo.create({
        email: `qa-admin-${suffix}@test.com`,
        password: hashed,
        name: 'QA Admin',
        role: 'buyer',
      }),
    );
    createdUserIds.push(adminUser.id);
    const adminStaff = await staffRepo.save(
      staffRepo.create({ user_id: adminUser.id, role: 'admin', active: true, created_by: null }),
    );
    createdStaffIds.push(adminStaff.id);

    // asesor interno
    const asesorUser = await userRepo.save(
      userRepo.create({
        email: `qa-asesor-${suffix}@test.com`,
        password: hashed,
        name: 'QA Asesor',
        role: 'buyer',
      }),
    );
    createdUserIds.push(asesorUser.id);
    const asesorStaff = await staffRepo.save(
      staffRepo.create({ user_id: asesorUser.id, role: 'asesor', active: true, created_by: null }),
    );
    createdStaffIds.push(asesorStaff.id);

    // operador interno
    const operadorUser = await userRepo.save(
      userRepo.create({
        email: `qa-operador-${suffix}@test.com`,
        password: hashed,
        name: 'QA Operador',
        role: 'buyer',
      }),
    );
    createdUserIds.push(operadorUser.id);
    const operadorStaff = await staffRepo.save(
      staffRepo.create({
        user_id: operadorUser.id,
        role: 'operador',
        active: true,
        created_by: null,
      }),
    );
    createdStaffIds.push(operadorStaff.id);

    // login para obtener tokens reales (vía la propia API)
    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'Password123' });
      return res.body.record.token as string;
    };

    buyerToken = await login(buyer.email);
    adminToken = await login(adminUser.email);
    asesorToken = await login(asesorUser.email);
    operadorToken = await login(operadorUser.email);

    // seller de prueba para el test de /sellers/:id/verify
    const sellerUser = await userRepo.save(
      userRepo.create({
        email: `qa-seller-${suffix}@test.com`,
        password: hashed,
        name: 'QA Seller',
        role: 'buyer',
      }),
    );
    createdUserIds.push(sellerUser.id);
    const seller = await sellerRepo.save(
      sellerRepo.create({
        user_id: sellerUser.id,
        business_name: `QA Seller Biz ${suffix}`,
        verified: false,
      }),
    );
    createdSellerIds.push(seller.id);
    sellerIdForVerify = seller.id;
  });

  afterAll(async () => {
    if (createdVehiclePlates.length) {
      await vehicleRepo
        .createQueryBuilder()
        .delete()
        .where('plate IN (:...plates)', { plates: createdVehiclePlates })
        .execute();
    }
    if (createdSellerIds.length) {
      await sellerRepo.delete(createdSellerIds);
    }
    if (createdStaffIds.length) {
      await staffRepo.delete(createdStaffIds);
    }
    if (createdUserIds.length) {
      await userRepo.delete(createdUserIds);
    }
    await app.close();
  });

  describe('POST /vehicles', () => {
    it('sin token → 401', async () => {
      const res = await request(app.getHttpServer()).post('/vehicles').send({
        price: 10000,
        mileage: 1000,
        plate: 'QATEST01',
      });
      expect(res.status).toBe(401);
      expect(res.body.errors?.message).toBeDefined();
    });

    it('con token válido → 201', async () => {
      const plate = `QA${Date.now().toString().slice(-8)}`;
      createdVehiclePlates.push(plate);
      const res = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ price: 15000, mileage: 500, plate });

      expect(res.status).toBe(201);
      expect(res.body.record).toBeDefined();
      expect(res.body.record.plate).toBe(plate);
    });
  });

  describe('GET /vehicles', () => {
    it('sin token → 200 (público)', async () => {
      const res = await request(app.getHttpServer()).get('/vehicles');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rows');
      expect(res.body).toHaveProperty('currentPage');
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('totalItems');
      expect(res.body).toHaveProperty('limit');
    });
  });

  describe('GET /vehicles/:id', () => {
    it('id inexistente (uuid válido) → 404', async () => {
      const res = await request(app.getHttpServer()).get(
        '/vehicles/00000000-0000-0000-0000-000000000000',
      );
      expect(res.status).toBe(404);
      expect(res.body.errors?.message).toBeDefined();
    });
  });

  describe('GET /internal/staff', () => {
    it('usuario sin internalRole (buyer normal) → 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/internal/staff')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.errors?.message).toBeDefined();
    });

    it('admin → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/internal/staff')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('POST /auth/register — tax_id duplicado (Bug 1)', () => {
    it('dos sellers con el mismo tax_id → el segundo da 409 y solo queda 1 fila en DB', async () => {
      const suffix = Date.now();
      const sharedTaxId = `TAX-TEST-FIX-${suffix}`;

      const first = await request(app.getHttpServer()).post('/auth/register').send({
        email: `qa-dup-tax-1-${suffix}@test.com`,
        password: 'Password123',
        name: 'QA Dup Tax One',
        role: 'seller',
        business_name: 'QA Dup Tax Biz One',
        tax_id: sharedTaxId,
        phone: '3000000001',
      });
      expect(first.status).toBe(201);
      expect(first.body.record?.seller?.tax_id).toBe(sharedTaxId);
      createdUserIds.push(first.body.record.user.id);
      const firstSeller = await sellerRepo.findOne({ where: { user_id: first.body.record.user.id } });
      expect(firstSeller).not.toBeNull();
      createdSellerIds.push(firstSeller!.id);

      const second = await request(app.getHttpServer()).post('/auth/register').send({
        email: `qa-dup-tax-2-${suffix}@test.com`,
        password: 'Password123',
        name: 'QA Dup Tax Two',
        role: 'seller',
        business_name: 'QA Dup Tax Biz Two',
        tax_id: sharedTaxId,
        phone: '3000000002',
      });
      expect(second.status).toBe(409);
      expect(second.body.errors?.message).toBeDefined();

      // el usuario del segundo intento se crea antes del rollback de la transacción del
      // seller, pero el rollback debe revertir también la creación de ese user porque
      // ambos ocurren dentro de la misma transacción (ver auth.service.ts).
      const secondUser = await userRepo.findOne({
        where: { email: `qa-dup-tax-2-${suffix}@test.com` },
      });
      expect(secondUser).toBeNull();

      const rowsWithSharedTaxId = await sellerRepo.count({ where: { tax_id: sharedTaxId } });
      expect(rowsWithSharedTaxId).toBe(1);
    });
  });

  describe('GET /sellers/me (Bug 2 — no debe duplicar el envoltorio message/record)', () => {
    it('devuelve { message, record } una sola vez, no anidado', async () => {
      const suffix = Date.now();
      const hashed = await bcrypt.hash('Password123', 10);
      const meUser = await userRepo.save(
        userRepo.create({
          email: `qa-seller-me-${suffix}@test.com`,
          password: hashed,
          name: 'QA Seller Me',
          role: 'buyer',
        }),
      );
      createdUserIds.push(meUser.id);
      const meSeller = await sellerRepo.save(
        sellerRepo.create({
          user_id: meUser.id,
          business_name: `QA Seller Me Biz ${suffix}`,
          verified: false,
        }),
      );
      createdSellerIds.push(meSeller.id);

      const meToken = await (async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: meUser.email, password: 'Password123' });
        return res.body.record.token as string;
      })();

      const res = await request(app.getHttpServer())
        .get('/sellers/me')
        .set('Authorization', `Bearer ${meToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
      expect(res.body.record).toBeDefined();
      expect(res.body.record.record).toBeUndefined();
      expect(res.body.record.id).toBe(meSeller.id);
      expect(res.body.record.business_name).toBe(meSeller.business_name);
    });
  });

  describe('PATCH /sellers/:id/verify', () => {
    it('rol operador → 403', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/sellers/${sellerIdForVerify}/verify`)
        .set('Authorization', `Bearer ${operadorToken}`);
      expect(res.status).toBe(403);
      expect(res.body.errors?.message).toBeDefined();
    });

    it('rol asesor → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/sellers/${sellerIdForVerify}/verify`)
        .set('Authorization', `Bearer ${asesorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.record?.verified).toBe(true);
    });
  });
});
