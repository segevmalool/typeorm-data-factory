import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('hello-world')
class HelloWorld extends LitElement {
  @state() private x: number;

  constructor() {
    super();
    this.x = 0;
  }

  render () {
    return html`
      hello ${this.x}
    `;
  }
}
