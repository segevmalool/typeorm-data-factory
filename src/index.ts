import { GlobalDataSource } from './typeorm';
import { ObjectLiteral } from 'typeorm';
import { generateEntitiesWithDependencies } from './data-factory';

async function main() {
  // Assume the db is built up as needed for seeding.
  await GlobalDataSource.initialize();

  const allEntities: ObjectLiteral[] = generateEntitiesWithDependencies(
      GlobalDataSource.entityMetadatas[GlobalDataSource.entityMetadatas.length - 1],
      GlobalDataSource.manager
  );

  await GlobalDataSource.manager.save(allEntities);

  await GlobalDataSource.destroy();

  return allEntities;
}

if (require.main === module) {
  main().then((entities) => console.log('Created entities: ', entities));
}