import { DataSource, DataSourceOptions } from 'typeorm';

import { User } from './entities';
import { Transfer } from './entities';
import { Authority } from './entities';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'segevmalool',
  database: 'bank',
  migrations: [__dirname + '/migrations/*.js'],
  entities: [User, Transfer, Authority],
  synchronize: false,
};

export const GlobalDataSource = new DataSource(dataSourceOptions);
