import 'reflect-metadata';

import { GlobalDataSource } from './typeorm';

import { User } from './entities';

(async function main() {
  await GlobalDataSource.initialize();

  const userRepository = GlobalDataSource.getRepository(User);

  userRepository.find().then((users) => {
    console.log(users);
  });

  setInterval(() => {
    console.log('hearbeat');
  }, 1000);
})();
