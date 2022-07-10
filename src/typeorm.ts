import { DataSource, DataSourceOptions } from 'typeorm';

import { User } from './entities';
import { Transaction } from './entities/transaction.entity';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'segevmalool',
  database: 'friends',
  migrations: [__dirname + '/migrations/*.js'],
  entities: [User, Transaction],
  synchronize: false,
};

export const GlobalDataSource = new DataSource(dataSourceOptions);
