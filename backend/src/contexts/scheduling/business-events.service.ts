import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessEvent } from './entities/business-event.entity';

@Injectable()
export class BusinessEventsService {
  constructor(
    @InjectRepository(BusinessEvent)
    private readonly businessEventRepo: Repository<BusinessEvent>,
  ) {}

  async record(
    eventType: string,
    entityType: 'vehicle' | 'appointment',
    entityId: string,
    payload: Record<string, unknown> | null = null,
  ): Promise<void> {
    await this.businessEventRepo.save(
      this.businessEventRepo.create({
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId,
        payload,
      }),
    );
  }
}
