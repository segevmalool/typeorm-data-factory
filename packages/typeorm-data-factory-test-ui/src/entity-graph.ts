import {LitElement, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import cy from 'cytoscape';
import { EntityMetadata } from 'typeorm';

const typeormErdUrl = 'http://localhost:3000';

interface Graph<T> {
  nodes: T[];
  edges: T[][]; // length 2
}

@customElement('entity-graph')
export class EntityGraph extends LitElement {
  @state()
  private entityGraph: Graph<string>;
  private cytoscapeContext: cy.Core;

  constructor() {
    super();
  }
  
  buildCyGraph(graph: Graph<string>) {
    for (const node of graph.nodes) {
      this.cytoscapeContext.add({
        group: 'nodes',
        data: {
          id: node,
          label: node,
        }
      });
    }
  }

  async loadEntityGraph() {
    await fetch(`${typeormErdUrl}/entityGraph`).then(async (response) => {
      this.entityGraph = await response.json() as Graph<string>;
    });
  }

  async connectedCallback() {
    this.cytoscapeContext = cy({
      container: this,
      style: [
        {
          selector: 'node, edge',
          style: {
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center'
          }
        }
      ],
    });

    await this.loadEntityGraph();
    console.log(this.entityGraph);

    this.buildCyGraph(this.entityGraph);

    const layout = this.cytoscapeContext.layout({
      name: 'random',
    });

    layout.run();

    this.cytoscapeContext.fit();
  }

  render() {
    return html`
        <div id="abc"></div>
    `;
  }
}
