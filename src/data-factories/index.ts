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

interface DataWithDescription {
  entity: EntityMetadata;
  instanceData: ObjectLiteral;
}

function generateInstanceData(entityMeta: EntityMetadata): DataWithDescription[] {

  function _generateInstanceData(entityMeta: EntityMetadata, accumulator: DataWithDescription[]): DataWithDescription[] {
    // Generates records for an arbitrary db entity and its dependencies.
    let dependenciesInstanceData: DataWithDescription[];
    const instanceData: typeof entityMeta.propertiesMap = {};

    for (let colMeta of entityMeta.columns) {
      if (colMeta.referencedColumn) {
        dependenciesInstanceData = _generateInstanceData(
            colMeta.referencedColumn.entityMetadata,
            accumulator
        );
      }

      // Generate a data for the column
      const colType = colMeta.type as ColumnType;
      const colTypeFactory = typeFactory[colType.toString()];

      instanceData[colMeta.propertyName] = colTypeFactory() || null;

      if (colMeta.referencedColumn) {
        // if this is a foreign key reference, override the generated id with the dependency id
        // @ts-ignore
        instanceData[colMeta.propertyName] = dependenciesInstanceData[dependenciesInstanceData.length - 1].instanceData.id;
      }
    }
    accumulator.push({instanceData, entity: entityMeta} as DataWithDescription);
    return [
      ...accumulator.filter(describedData => describedData.instanceData.id !== instanceData.id),
      { instanceData, entity: entityMeta }
    ];
  }

  return _generateInstanceData(entityMeta, []);
}

function generateSingleEntity(
  describedData: DataWithDescription,
  dataSource: DataSource
) {
  const instance = dataSource.manager.create(
    describedData.entity.inheritanceTree[0].prototype.constructor,
    describedData.instanceData
  );

  return instance;
}

function generateAllEntities(dataSource: DataSource) {
  // Generates records for all entities in the datasource, respecting foreign keys.
  const rootEntity = dataSource.entityMetadatas[dataSource.entityMetadatas.length-1];

  const describedInstanceData: DataWithDescription[] = generateInstanceData(rootEntity);
  const allEntities = describedInstanceData.map(
      (describedData) => generateSingleEntity(
          describedData, dataSource
      )
  );

  return allEntities;
}

async function main() {
  // Assume the db is built up as needed for seeding.
  await GlobalDataSource.initialize();

  const allEntities: ObjectLiteral[] = generateAllEntities(GlobalDataSource);

  await GlobalDataSource.manager.save(allEntities);

  await GlobalDataSource.destroy();

  return allEntities;
}

if (require.main === module) {
  main().then((entities) => console.log('Created entities: ', entities));
}
