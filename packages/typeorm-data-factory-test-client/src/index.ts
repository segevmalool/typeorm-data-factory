import type { IncomingMessage } from 'http';
import express from 'express';
import cors from 'cors';
import { EntityMetadata } from 'typeorm';
import * as _ from 'lodash';

import { GlobalDataSource } from 'typeorm-data-factory-test-db';
import { generateEntitiesWithDependencies, getDependencyColumns } from 'typeorm-data-factory';

GlobalDataSource.initialize();

const entityGraphRouter = express.Router();
const generateDataRouter = express.Router();

interface Graph<T> {
  nodes: T[];
  edges: T[][]; // length 2
}

function entityMetadatasToGraph(metas: EntityMetadata[]): Graph<string> {
  const graph = {nodes: [], edges: []} as Graph<string>;

  // Add nodes
  for (const entityMeta of metas) {
    graph.nodes.push(entityMeta.name);
  }

  // Add edges
  for (const entityMeta of metas) {
    const relationships = getDependencyColumns(entityMeta as any);

    for (const colMeta of relationships) {
      graph.edges.push([
          colMeta.entityMetadata.name,
          colMeta.referencedColumn!.entityMetadata.name,
      ]);
    }
  }

  return graph
}

entityGraphRouter.get('/entityGraph', (req: IncomingMessage, res, next) => {
  const erd = entityMetadatasToGraph(GlobalDataSource.entityMetadatas as any);
  res.end(JSON.stringify(erd));
  next();
});

generateDataRouter.get('/generateData/:entityName', async (req, res, next) => {
  const { entityName } = req.params;
  const entity = GlobalDataSource.entityMetadatas.find(
      (entity) => entity.inheritanceTree[0].prototype.constructor.name === entityName
  );

  if (!entity) {
    res.status(404);
    res.end(JSON.stringify({error: {message: 'entity not found'}}));
    next();
    return;
  }

  const instances = generateEntitiesWithDependencies(entity!, GlobalDataSource.manager);

  const grouped = _.groupBy(instances, (instance => instance.constructor.name));
  
  await GlobalDataSource.manager.save(instances);

  res.end(JSON.stringify(grouped));
  next();
});

const app = express();

app.use(cors());
app.use(entityGraphRouter);
app.use(generateDataRouter);

export default app;
