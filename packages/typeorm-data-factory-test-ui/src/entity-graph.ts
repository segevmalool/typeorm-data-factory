import {LitElement, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import cy from 'cytoscape';
import { EntityMetadata } from 'typeorm';
import { v4 as uuid } from 'uuid';

export const typeormErdUrl = 'http://localhost:3000';

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

    for (const edge of graph.edges) {
      this.cytoscapeContext.add({
        group: 'edges',
        data: {
          id: uuid(),
          source: edge[0],
          target: edge[1],
          directed: true,
        }
      })
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
    this.buildCyGraph(this.entityGraph);
    const layout = this.cytoscapeContext.layout({
      name: 'random',
    });
    // @ts-ignore
    this.cytoscapeContext.style().selector('edge').style('curve-style', 'bezier').style('target-arrow-shape', 'vee');
    layout.run();
    this.cytoscapeContext.fit();

    this.cytoscapeContext.nodes().forEach((node) => {
      node.on('click', (event) => {
        this.dispatchEvent(new CustomEvent('entitySelected', {
          composed: true,
          detail: {entityName: event.target.data().label}
        }));
      });
    });
  }

  render() {
    return html`
        <div id="abc"></div>
    `;
  }
}
