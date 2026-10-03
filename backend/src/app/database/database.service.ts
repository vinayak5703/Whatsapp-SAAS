import { Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  private readonly connectionString?: string;

  constructor(config: ConfigService) {
    this.connectionString = config.get<string>('DATABASE_URL');
    this.pool = new Pool({
      connectionString: this.connectionString,
      max: config.get<number>('DATABASE_POOL_MAX', 20),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async withTenant<T>(tenantId: string, operation: (client: PoolClient) => Promise<T>): Promise<T> {
    this.ensureConnectionString();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async checkConnection(): Promise<void> {
    this.ensureConnectionString();
    await this.pool.query('SELECT 1');
  }

  private ensureConnectionString(): void {
    if (!this.connectionString) {
      throw new ServiceUnavailableException('DATABASE_URL is missing. Create the project-root .env from .env.example and set the local PostgreSQL connection.');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}