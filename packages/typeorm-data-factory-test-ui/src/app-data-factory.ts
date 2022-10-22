import {css, html, LitElement, TemplateResult} from 'lit';
import {customElement, state} from 'lit/decorators.js';

import '@material/mwc-button';
import '@material/mwc-dialog';

import './entity-graph';

import { typeormErdUrl } from './entity-graph';

@customElement('app-data-factory')
class DataFactory extends LitElement {
  @state()
  selectedEntity: string = '';

  @state()
  generatedData: { [key: string]: any[] } = {};

  @state()
  openDataDialogP: boolean = false;

  constructor() {
    super();
    this.addEventListener('entitySelected', (event: Event) => {
      if (!(event as CustomEvent).detail.entityName) {
        throw new Error('entity name not provided');
      }
      this.selectedEntity = (event as CustomEvent).detail.entityName;
    });
  }

  static styles = css`
    entity-graph {
      width: 500px;
      height: 500px;
      border: 1px solid black;
      display: block;
    }

    mwc-button {
      padding-bottom: 10px;
    }
  `;

  async generateData(event: Event) {
    console.assert(this.selectedEntity, 'Must select an entity before generating data');

    await fetch(`${typeormErdUrl}/generateData/${this.selectedEntity}`).then(async response => {
      const responseBody = await response.json();

      for (const key in responseBody) {
        if (!this.generatedData[key]) {
          this.generatedData[key] = [];
        }
        this.generatedData[key] = [
          ...this.generatedData[key],
          ...responseBody[key],
        ];
      }
    });
  }

  openDataDialog() {
    this.openDataDialogP = !this.openDataDialogP;
  }

  getGeneratedInstances(entityName: string) {
    return this.generatedData[this.selectedEntity];
  }

  render() {
    return html`
      <h1>I love data so I made an app to generate more of it</h1>
      <div>
        <mwc-button ?disabled="${!this.selectedEntity}" outlined @click="${this.generateData}">
          Generate data for ${this.selectedEntity} and its dependencies
        </mwc-button>
        <br/>
        <mwc-button ?disabled="${!this.selectedEntity}" outlined @click="${this.openDataDialog}">
          Inspect data for ${this.selectedEntity}
        </mwc-button>
      </div>
      <mwc-dialog
          ?open="${this.openDataDialogP}"
          @closed="${this.openDataDialog}"
          heading="Data Generated for ${this.selectedEntity}"
      >
        ${
            this.generatedData[this.selectedEntity] ? html`
              <div>
                ${this.generatedData[this.selectedEntity].map(instance => html`
                  <div>${instance.id}</div>
                `)}
              </div>
            ` : null
        }
      </mwc-dialog>
      <entity-graph></entity-graph>
    `;
  }
}
