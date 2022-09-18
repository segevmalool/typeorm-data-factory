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

const PLACEHOLDER = 'PLACEHOLDER';

interface AnnotatedData {
  instance: ObjectLiteral;
  meta: EntityMetadata;
}

export function generateInstanceDataWithDependencies(
  entityMeta: EntityMetadata
): any {

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

  function _getRelationshipColumns(entityMeta: EntityMetadata) {
    const dependencyColumns = []
    for (let colMeta of entityMeta.columns) {
      if (colMeta.referencedColumn && colMeta.relationMetadata) {
        dependencyColumns.push(colMeta);
      }
    }
    return dependencyColumns;
  }

  function _generateNumInstances(
      dependencyColumns: ColumnMetadata[],
      entityMeta: EntityMetadata,
      numInstances: number
  ): {[key: string]: (typeof entityMeta.propertiesMap)[]} | (typeof entityMeta.propertiesMap)[] {

    if (dependencyColumns.length > 0) {
      const instances: { [key: string]: (typeof entityMeta.propertiesMap)[] } = {};

      for (const colMeta of dependencyColumns) {
        assert(
            colMeta.relationMetadata && colMeta.referencedColumn,
            "Column is not an FK (2)."
        );

        for (let i = 0; i < numInstances; i += 1) {
          if (!instances[colMeta.propertyName])
            instances[colMeta.propertyName] = [];
          const instance = _generateInstanceWithRelationshipPlaceholders(entityMeta);
          instances[colMeta.propertyName].push(instance);
        }
      }

      return instances;
    } else {
      const instances: ObjectLiteral[] = [];

      for (let i = 0; i < numInstances; i += 1) {
        const instance = _generateInstanceWithRelationshipPlaceholders(entityMeta);
        instances.push(instance);
      }

      return instances;
    }

    return []; // Should never happen
  }

  function _generateInstanceData(
    entityMeta: EntityMetadata,
    accumulator: any,
  ) {
    // 1. Find FK cols.
    const dependencyColumns: ColumnMetadata[] =
        _getRelationshipColumns(entityMeta);

    // 2. Generate one or many placeholder records for each dependency column
    const instances: {[key: string]: (typeof entityMeta.propertiesMap)[]} | (typeof entityMeta.propertiesMap)[] =
        _generateNumInstances(dependencyColumns, entityMeta, 1);

    const dependencyInstances: any = {};
    for (const colMeta of dependencyColumns) {
      for (const colMetaTwo of dependencyColumns) {
        if (!dependencyInstances[colMetaTwo.propertyName])
            dependencyInstances[colMetaTwo.propertyName] = {}

        dependencyInstances[colMeta.propertyName][colMetaTwo.propertyName] =
            _generateInstanceData(
                // @ts-ignore
                colMetaTwo.referencedColumn.entityMetadata,
                accumulator
            );
      }
    }

    if (dependencyColumns.length === 0) {
      accumulator = {
        instances,
        entityMeta,
        hasDependencies: false
      };
    } else {
      accumulator = {
        ...dependencyInstances,
        instances,
        entityMeta,
        hasDependencies: true,
        dependencies: dependencyColumns
      };
    }

    return accumulator;
  }

  function _fillDependenciesAndReduce(data: any, accumulator: any[]): any[] {
    let filledInstances: AnnotatedData[] = [];
    let filledDependencyInstances: any = {};

    if (data.hasDependencies) {
      for (const colMeta of data.dependencies) {
        for (const colMetaTwo of data.dependencies) {
          for (let i = 0; i < data.instances[colMeta.propertyName].length; i += 1) {
            const instance = data.instances[colMeta.propertyName][i];

            // Assume each entity has an id field, and the foreign keys always reference the id field.
            if (data[colMeta.propertyName][colMetaTwo.propertyName].hasDependencies) {
              if (colMetaTwo.relationMetadata.isManyToOne) {
                const arbitraryDependency = data[colMeta.propertyName][colMetaTwo.propertyName]
                    .dependencies[0].propertyName;
                instance[colMetaTwo.propertyName] = data[colMeta.propertyName][colMetaTwo.propertyName]
                    .instances[arbitraryDependency][0].id;
              } else if (colMetaTwo.relationMetadata.isOneToOne) {
                const arbitraryDependency = data[colMeta.propertyName][colMetaTwo.propertyName]
                    .dependencies[0].propertyName;
                instance[colMetaTwo.propertyName] = data[colMeta.propertyName][colMetaTwo.propertyName]
                    .instances[arbitraryDependency][i].id;
              }
            } else {
              if (colMetaTwo.relationMetadata.isManyToOne) {
                instance[colMetaTwo.propertyName] = data[colMeta.propertyName][colMetaTwo.propertyName].instances[0].id;
              } else if (colMetaTwo.relationMetadata.isOneToOne) {
                instance[colMetaTwo.propertyName] = data[colMeta.propertyName][colMetaTwo.propertyName].instances[i].id;
              }
            }
          }
        }
      }

      for (const colMeta of data.dependencies) {
        filledInstances.push(
            ...data.instances[colMeta.propertyName].map((instance: any) => ({
              instance,
              meta: data.entityMeta
            }))
        );
      }

      for (const colMeta of data.dependencies) {
        for (const colMetaTwo of data.dependencies) {
          if (!filledDependencyInstances[colMeta.propertyName])
            filledDependencyInstances[colMeta.propertyName] = {};

          filledDependencyInstances[colMeta.propertyName][colMetaTwo.propertyName] = _fillDependenciesAndReduce(
              data[colMeta.propertyName][colMetaTwo.propertyName],
              accumulator
          );
        }
      }

      for (const colMeta of data.dependencies) {
        for (const colMetaTwo of data.dependencies) {
          filledInstances.push(...filledDependencyInstances[colMeta.propertyName][colMetaTwo.propertyName]);
        }
      }
    } else {
      filledInstances = data.instances.map((instance: any) => ({
        instance,
        meta: data.entityMeta
      }));
    }

    return accumulator.concat(filledInstances);
  }

  let generatedData = _generateInstanceData(entityMeta, {});
  return _fillDependenciesAndReduce(generatedData, []);
}

export function generateEntitiesWithDependencies(
    rootEntity: EntityMetadata,
    manager: EntityManager
) {

  const describedInstanceData: any = generateInstanceDataWithDependencies(rootEntity);

  const allEntities = describedInstanceData.map((describedData: AnnotatedData) =>
      manager.create(
          describedData.meta.inheritanceTree[0].prototype.constructor,
          describedData.instance
      )
  );

  return allEntities;
}

