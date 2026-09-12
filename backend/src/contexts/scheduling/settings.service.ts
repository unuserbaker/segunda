import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulingSetting } from './entities/scheduling-setting.entity';

const CACHE_TTL_MS = 60 * 1000;

const DEFAULTS: Array<{ key: string; value: string; description: string }> = [
  {
    key: 'rsvp_release_window_hours',
    value: '4',
    description: 'Horas antes de la cita en que se libera si no hay RSVP',
  },
  {
    key: 'customer_link_window_hours',
    value: '72',
    description: 'Ventana del link de un clic para el customer',
  },
  {
    key: 'fee_per_attended_cop',
    value: '1000',
    description: 'Tarifa cobrada por visita atendida (COP)',
  },
  {
    key: 'n_alternative_vehicles',
    value: '3',
    description: 'Cantidad de vehículos alternativos sugeridos al cancelar por venta',
  },
  {
    key: 'notification_channels_enabled',
    value: 'email',
    description: 'Canales de notificación habilitados, separados por coma',
  },
];

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private cache = new Map<string, { value: string; expiresAt: number }>();

  constructor(
    @InjectRepository(SchedulingSetting)
    private readonly settingsRepo: Repository<SchedulingSetting>,
  ) {}

  async get<T extends string | number>(key: string, fallback: T): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return this.cast(cached.value, fallback);
    }

    const row = await this.settingsRepo.findOneBy({ key });
    if (!row) {
      return fallback;
    }

    this.cache.set(key, { value: row.value, expiresAt: Date.now() + CACHE_TTL_MS });
    return this.cast(row.value, fallback);
  }

  private cast<T extends string | number>(value: string, fallback: T): T {
    if (typeof fallback === 'number') {
      const n = Number(value);
      return (Number.isNaN(n) ? fallback : n) as T;
    }
    return value as T;
  }

  /** Seed idempotente por clave individual (no `count()` global, ver docs-db-spec). */
  async seedDefaults(): Promise<void> {
    for (const setting of DEFAULTS) {
      const exists = await this.settingsRepo.findOneBy({ key: setting.key });
      if (!exists) {
        await this.settingsRepo.save(setting);
      }
    }
  }
}
