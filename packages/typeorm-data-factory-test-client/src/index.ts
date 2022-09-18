import express from 'express';
import cors from 'cors';
import { EntityMetadata } from 'typeorm';

import { GlobalDataSource } from 'typeorm-data-factory-test-db'

GlobalDataSource.initialize();

const app = express();

const entityGraphRouter = express.Router();

interface Graph<T> {
  nodes: T[];
  edges: T[][]; // length 2
}

function entityMetadatasToGraph(metas: EntityMetadata[]): Graph<string> {
  const graph = {nodes: [], edges: []} as Graph<string>;

  for (const entityMeta of metas) {
    graph.nodes.push(entityMeta.name);
  }

  return graph
}

entityGraphRouter.get('/entityGraph', (req, res, next) => {
  console.log(GlobalDataSource.entityMetadatas);
  const erd = entityMetadatasToGraph(GlobalDataSource.entityMetadatas as any);

  res.end(JSON.stringify(erd));
});

app.use(cors());
app.use(entityGraphRouter)

export default app;
