import { GlobalDataSource } from '../typeorm';

import { ColumnType, DataSource, EntityMetadata, ObjectLiteral } from 'typeorm';
import { v4 as uuid } from 'uuid';

// The string key is to handle the constructor-based ColumnTypes.
const typeFactory: { [key: string]: Function } = {
  uuid,
  string: () => 'bob',
  'function String() { [native code] }': () => 'bob',
  numeric: () => 35.00
};

function generateInstanceData(entityMeta: EntityMetadata): ObjectLiteral[] {

  function _generateInstanceData(entityMeta: EntityMetadata, accumulator: ObjectLiteral[]): ObjectLiteral[] {
    // Generates records for an arbitrary db entity and its dependencies.
    let dependenciesInstanceData: ObjectLiteral;
    const instanceData: typeof entityMeta.propertiesMap = {};

    for (let colMeta of entityMeta.columns) {
      if (colMeta.referencedColumn) {
        dependenciesInstanceData = _generateInstanceData(colMeta.referencedColumn.entityMetadata, accumulator);
      }

      // Generate a data for the column
      const colType = colMeta.type as ColumnType;
      const colTypeFactory = typeFactory[colType.toString()];

      if (!colTypeFactory) {
        // if no factory is defined for this type, return null
        instanceData[colMeta.propertyName] = null;
      } else {
        instanceData[colMeta.propertyName] = colTypeFactory();
      }

      if (colMeta.referencedColumn) {
        // if this is a foreign key reference, override the generated id with the dependency id
        // @ts-ignore
        instanceData[colMeta.propertyName] = dependenciesInstanceData[dependenciesInstanceData.length - 1].id;
      }
    }

    accumulator.push(instanceData);
    return [...accumulator.filter(entity => entity.id !== instanceData.id), instanceData];
  }

  return _generateInstanceData(entityMeta, []);
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
  // Generates records for all entities in the datasource, respecting foreign keys.
  const rootEntity = dataSource.entityMetadatas[dataSource.entityMetadatas.length-1];

  const instanceData = generateInstanceData(rootEntity);
  const allEntities = instanceData.map(
      (instanceData) => generateSingleEntity(rootEntity, instanceData, dataSource)
  );
  console.log(allEntities);

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
