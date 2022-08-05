"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEntitiesWithDependencies = exports.generateInstanceDataWithDependencies = void 0;
const assert_1 = __importDefault(require("assert"));
const uuid_1 = require("uuid");
// The string key is to handle the constructor-based ColumnTypes.
const typeFactory = {
    uuid: uuid_1.v4,
    string: () => 'bob',
    'function String() { [native code] }': () => 'bob',
    numeric: () => 35.0,
};
const PLACEHOLDER = (0, uuid_1.v4)();
function generateInstanceDataWithDependencies(entityMeta) {
    function _generateInstanceWithRelationshipPlaceholders(entityMeta) {
        const instanceData = {};
        for (let colMeta of entityMeta.columns) {
            let generatedValue = null;
            if (colMeta.referencedColumn && colMeta.relationMetadata) {
                // Log the column name so we can generate a dependency later.
                generatedValue = PLACEHOLDER;
            }
            else {
                // Generate a data for the column
                const colType = colMeta.type;
                const colTypeFactory = typeFactory[colType.toString()];
                generatedValue = colTypeFactory() || null;
            }
            instanceData[colMeta.propertyName] = generatedValue;
        }
        return instanceData;
    }
    function getRelationshipColumns(entityMeta) {
        const dependencyColumns = [];
        for (let colMeta of entityMeta.columns) {
            if (colMeta.referencedColumn && colMeta.relationMetadata) {
                dependencyColumns.push(colMeta);
            }
        }
        return dependencyColumns;
    }
    function generateOneOrManyInstances(dependencyColumns, entityMeta) {
        const instances = {};
        for (const colMeta of dependencyColumns) {
            (0, assert_1.default)(colMeta.relationMetadata && colMeta.referencedColumn, "Column is not an FK (2).");
            const numInstances = colMeta.relationMetadata.isOneToOne ? 1 : 3;
            for (let i = 0; i < numInstances; i += 1) {
                const instance = _generateInstanceWithRelationshipPlaceholders(entityMeta);
                if (!instances[colMeta.propertyName])
                    instances[colMeta.propertyName] = [];
                instances[colMeta.propertyName].push(instance);
            }
        }
        return instances;
    }
    function _generateInstanceData(entityMeta, accumulator) {
        let allDependenciesInstanceData = [];
        // 1. Find FK cols.
        const dependencyColumns = getRelationshipColumns(entityMeta);
        // 2. Generate one or many placeholder records for each dependency column
        const instances = generateOneOrManyInstances(dependencyColumns, entityMeta);
        // 3. Generate dependencies for fk columns and fill in the
        const visitedDependencies = {};
        for (const colMeta of dependencyColumns) {
            (0, assert_1.default)(colMeta.relationMetadata && colMeta.referencedColumn, "Column is not an FK (3).");
            visitedDependencies[colMeta.propertyName] = _generateInstanceData(colMeta.referencedColumn.entityMetadata, accumulator);
            for (const colMetaTwo of dependencyColumns) {
                for (const instance of instances[colMetaTwo.propertyName]) {
                    for (const colName in visitedDependencies) {
                        if (instance[colName] !== PLACEHOLDER)
                            continue;
                        const dependency = visitedDependencies[colName];
                        instance[colName] =
                            dependency[dependency.length - 1].instanceData.id;
                    }
                }
            }
        }
        for (const colMeta of dependencyColumns) {
            accumulator.push(...instances[colMeta.propertyName].map((instance) => ({
                instanceData: instance,
                entity: entityMeta,
            })));
        }
        // 4. If it's a root, then generate a single instance.
        if (dependencyColumns.length === 0) {
            const instance = _generateInstanceWithRelationshipPlaceholders(entityMeta);
            accumulator.push({
                instanceData: instance,
                entity: entityMeta,
            });
        }
        return accumulator;
    }
    return _generateInstanceData(entityMeta, []);
}
exports.generateInstanceDataWithDependencies = generateInstanceDataWithDependencies;
function generateEntitiesWithDependencies(rootEntity, manager) {
    const describedInstanceData = generateInstanceDataWithDependencies(rootEntity);
    const allEntities = describedInstanceData.map((describedData) => manager.create(describedData.entity.inheritanceTree[0].prototype.constructor, describedData.instanceData));
    return allEntities;
}
exports.generateEntitiesWithDependencies = generateEntitiesWithDependencies;
//# sourceMappingURL=data-factory.js.map