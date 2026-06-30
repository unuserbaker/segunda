import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginatedResponse {
  currentPage: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  rows: unknown[];
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) {
          return { message: 'Success' };
        }

        if (this.isPaginatedResponse(data)) {
          return data;
        }

        if (Array.isArray(data)) {
          return { message: 'Success', records: data };
        }

        return { message: 'Success', record: data };
      }),
    );
  }

  private isPaginatedResponse(data: unknown): data is PaginatedResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'rows' in data &&
      'totalItems' in data &&
      'currentPage' in data &&
      'totalPages' in data
    );
  }
}
