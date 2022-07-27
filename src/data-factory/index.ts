import assert from 'assert';
import {
  ColumnType, DataSource, EntityManager, EntityMetadata, ObjectLiteral, Entity
} from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
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

const PLACEHOLDER = uuid();

export function generateInstanceDataWithDependencies(
  entityMeta: EntityMetadata
): DataWithDescription[] {

  function _generateInstanceWithRelationshipPlaceholders<T extends EntityMetadata>(
      entityMeta: T
  ): T['propertiesMap'] {
    const instanceData: typeof entityMeta.propertiesMap = {};

    for (let colMeta of entityMeta.columns) {
      let generatedValue = null;

      if (colMeta.referencedColumn && colMeta.relationMetadata) {
        // Log the column name so we can generate a dependency later.
        generatedValue = PLACEHOLDER;
      } else {
        // Generate a data for the column
        const colType = colMeta.type as ColumnType;
        const colTypeFactory = typeFactory[colType.toString()];
        generatedValue = colTypeFactory() || null;
      }

      instanceData[colMeta.propertyName] = generatedValue;
    }

    return instanceData;
  }

  function getRelationshipColumns(entityMeta: EntityMetadata) {
    const dependencyColumns = []
    for (let colMeta of entityMeta.columns) {
      if (colMeta.referencedColumn && colMeta.relationMetadata) {
        dependencyColumns.push(colMeta);
      }
    }
    return dependencyColumns;
  }

  function generateOneOrManyInstances(
      dependencyColumns: ColumnMetadata[],
      entityMeta: EntityMetadata
  ): {[key: string]: (typeof entityMeta.propertiesMap)[]} {
    const instances: {[key: string]: (typeof entityMeta.propertiesMap)[]} = {};
    for (const colMeta of dependencyColumns) {
      assert(
          colMeta.relationMetadata && colMeta.referencedColumn,
          "Column is not an FK (2)."
      );

      const numInstances = colMeta.relationMetadata.isOneToOne ? 1 : 3;

      for (let i = 0; i < numInstances; i += 1) {
        const instance = _generateInstanceWithRelationshipPlaceholders(entityMeta);
        if (!instances[colMeta.propertyName])
          instances[colMeta.propertyName] = []
        instances[colMeta.propertyName].push(instance);
      }
    }

    return instances;
  }

  function _generateInstanceData(
    entityMeta: EntityMetadata,
    accumulator: DataWithDescription[]
  ): DataWithDescription[] {
    let allDependenciesInstanceData: DataWithDescription[] = [];

    // 1. Find FK cols.
    const dependencyColumns: ColumnMetadata[] =
        getRelationshipColumns(entityMeta);

    // 2. Generate one or many placeholder records for each dependency column
    const instances: {[key: string]: (typeof entityMeta.propertiesMap)[]} =
        generateOneOrManyInstances(dependencyColumns, entityMeta);

    // 3. Generate dependencies for fk columns and fill in the
    const visitedDependencies: {[key: string]: DataWithDescription[]} = {};
    for (const colMeta of dependencyColumns) {
      assert(
          colMeta.relationMetadata && colMeta.referencedColumn,
          "Column is not an FK (3)."
      );

      visitedDependencies[colMeta.propertyName] = _generateInstanceData(
          colMeta.referencedColumn.entityMetadata,
          accumulator
      );

      for (const colMetaTwo of dependencyColumns) {
        for (const instance of instances[colMetaTwo.propertyName]) {
          for (const colName in visitedDependencies) {
            if (instance[colName] !== PLACEHOLDER) continue;
            const dependency = visitedDependencies[colName];
            instance[colName] =
                dependency[dependency.length - 1].instanceData.id;
          }
        }
      }
    }

    for (const colMeta of dependencyColumns) {
      accumulator.push(
          ...instances[colMeta.propertyName].map((instance) => ({
            instanceData: instance,
            entity: entityMeta,
          } as DataWithDescription))
      );
    }

    // 4. If it's a root, then generate a single instance.
    if (dependencyColumns.length === 0) {
      const instance = _generateInstanceWithRelationshipPlaceholders(entityMeta);
      accumulator.push({
        instanceData: instance,
        entity: entityMeta,
      } as DataWithDescription);
    }

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
