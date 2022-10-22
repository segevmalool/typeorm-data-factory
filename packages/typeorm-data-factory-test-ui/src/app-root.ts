import { LitElement, html, css } from 'lit';
import { state, customElement } from 'lit/decorators.js';

import './app-data-factory';

@customElement('app-root')
class AppRoot extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 10px;
      border-left: 10px solid green;
    }
  `;

  render() {
    return html`
      <app-data-factory></app-data-factory>
    `;
  }
}
