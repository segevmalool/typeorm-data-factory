import { Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryColumn({ type: 'uuid' })
  id: string;
}
