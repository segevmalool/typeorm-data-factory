import { GlobalDataSource } from '../typeorm';

import { ColumnType, DataSource, EntityMetadata, ObjectLiteral } from 'typeorm';
import { v4 as uuid } from 'uuid';

// The reason for the string key is to handle the constructor-based ColumnTypes.
const typeFactory: { [key: string]: Function } = {
  uuid,
  string: () => 'bob',
  'function String() { [native code] }': () => 'bob',
};

export function generateInstanceData(entityMeta: EntityMetadata) {
  // Generates a record for an arbitrary db entity.

  const instanceData: typeof entityMeta.propertiesMap = {};

  for (let colMeta of entityMeta.columns) {
    if (colMeta.isGenerated) {
      continue;
    }

    const colType = colMeta.type as ColumnType;
    const colTypeFactory = typeFactory[colType.toString()];

    if (!colTypeFactory) {
      // if no factory is defined for this type, return null
      instanceData[colMeta.propertyName] = null;
    } else {
      instanceData[colMeta.propertyName] = colTypeFactory();
    }
  }

  return instanceData;
}

function generateSingleEntity<T extends EntityMetadata>(
    entityMeta: T,
    instanceData: typeof EntityMetadata.prototype.propertiesMap,
    dataSource: DataSource
) {
    const instance = dataSource.manager.create(
        entityMeta.inheritanceTree[0].prototype.constructor,
        instanceData
    );

    return instance;
}

function generateAllEntities(dataSource: DataSource) {
    const allEntities: ObjectLiteral[] = [];

    for (let entityMeta of dataSource.entityMetadatas) {
        const instanceData: typeof entityMeta.propertiesMap = generateInstanceData(entityMeta);

        const entity = generateSingleEntity(entityMeta, instanceData, dataSource);

        allEntities.push(entity);
    }

    return allEntities;
}

async function main() {
  // Assume the db is built up as needed for seeding.
  await GlobalDataSource.initialize();

  const allEntities: ObjectLiteral[] = generateAllEntities(GlobalDataSource);

  await GlobalDataSource.manager.save(allEntities);

  await GlobalDataSource.destroy();
}

if (require.main === module) {
  main();
}
