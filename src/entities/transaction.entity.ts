import {Column, Entity, ManyToOne, PrimaryColumn} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @ManyToOne((type) => User, (user) => user.id)
  from_user: User;

  @ManyToOne((type) => User, (user) => user.id)
  to_user: User;

  @Column({ type: 'numeric'})
  amount: number | string;
}
