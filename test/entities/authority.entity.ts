import {Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { User } from './user.entity';
import { Transfer } from './transfer.entity';

@Entity({name: 'authorities'})
export class Authority {
  @PrimaryColumn({name: 'id', type: 'uuid'})
  id: string;

  @ManyToOne((type) => User, (user) => user.id)
  user: User;

  @OneToOne((type) => Transfer, (transfer) => transfer.id)
  @JoinColumn()
  transfer: Transfer;
}