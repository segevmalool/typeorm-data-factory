import {
  ColumnType, DataSource, EntityManager, EntityMetadata, ObjectLiteral, Entity
} from 'typeorm';
import { v4 as uuid } from 'uuid';

// The string key is to handle the constructor-based ColumnTypes.
const typeFactory: { [key: string]: Function } = {
  uuid,
  string: () => 'bob',
  'function String() { [native code] }': () => 'bob',
  numeric: () => 35.0,
};

export interface DataWithDescription {
  entity: EntityMetadata;
  instanceData: ObjectLiteral;
}

export function generateInstanceDataWithDependencies(
  entityMeta: EntityMetadata
): DataWithDescription[] {
  function _generateInstanceData(
    entityMeta: EntityMetadata,
    accumulator: DataWithDescription[]
  ): DataWithDescription[] {
    // Generates records for an arbitrary db entity and its dependencies.
    let dependenciesInstanceData: DataWithDescription[] = [];
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
      let generatedValue = colTypeFactory() || null;

      if (colMeta.referencedColumn) {
        // if this is a foreign key reference, override the generated id with the dependency id
        generatedValue = dependenciesInstanceData[dependenciesInstanceData.length - 1].instanceData.id;
      }

      instanceData[colMeta.propertyName] = generatedValue;
    }

    accumulator.push({
      instanceData,
      entity: entityMeta,
    } as DataWithDescription);

    return accumulator;
  }

  return _generateInstanceData(entityMeta, []);
}

export function generateEntitiesWithDependencies(
    rootEntity: EntityMetadata,
    manager: EntityManager
) {

  const describedInstanceData: DataWithDescription[] =
    generateInstanceDataWithDependencies(rootEntity);

  const allEntities = describedInstanceData.map((describedData) =>
      manager.create(
          describedData.entity.inheritanceTree[0].prototype.constructor,
          describedData.instanceData
      )
  );

  return allEntities;
}
