import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GridStack } from 'gridstack';

export interface itemProp {
  x: number;
  y: number;
  w: number;
  h: number;
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [],
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FormBuilderComponent implements AfterViewInit {
  grid!: GridStack;
  itemCount = 0;
  columnNum = 36;

  ngAfterViewInit(): void {
    this.grid = GridStack.init({
      column: this.columnNum,
      row: 36,
      cellHeight: 100,
      margin: 5,
    });

    let lastWidgetState: {
      x: number;
      y: number;
      w: number;
      h: number;
      el: HTMLElement;
    } | null = null;

    this.grid.on('dragstart', (event, el) => {});

    this.grid.on('dragstop', (event, el) => {});
  }

  addItem1() {
    this.itemCount++;

    const w = this.columnNum;
    const h = 2;

    const nodes = this.grid.engine.nodes;
    const lastY = nodes.reduce((max, node) => {
      const y = (node.y ?? 0) + (node.h ?? 0);
      return Math.max(max, y);
    }, 0);

    // Outer section item
    const item = document.createElement('div');
    item.classList.add('grid-stack-item');
    item.setAttribute('gs-x', '0');
    item.setAttribute('gs-y', lastY.toString());
    item.setAttribute('gs-w', w.toString());
    item.setAttribute('gs-h', h.toString());

    // Outer content wrapper
    const content = document.createElement('div');
    content.classList.add('grid-stack-item-content');

    // Inner nested grid for fields
    const innerGrid = document.createElement('div');
    innerGrid.classList.add('grid-stack');
    innerGrid.setAttribute('data-gs-nested', 'true');

    // header item (fixed)
    const sectionHeader = document.createElement('div');
    sectionHeader.classList.add(
      'grid-stack-item',
      'field-grid-stack-fixed-header'
    );
    sectionHeader.innerHTML = ``;
    sectionHeader.setAttribute('gs-x', '0');
    sectionHeader.setAttribute('gs-y', '0');
    sectionHeader.setAttribute('gs-w', (this.columnNum - 1).toString());
    sectionHeader.setAttribute('gs-h', '1'); // give it height 1 so it's visible

    // disable drag + resize
    sectionHeader.setAttribute('gs-no-move', 'true');
    sectionHeader.setAttribute('gs-no-resize', 'true');
    sectionHeader.setAttribute('gs-locked', 'true');

    const sectionHeaderContentItem1 = document.createElement('div');
    sectionHeaderContentItem1.classList.add('inner-grid-stack-item-content');
    sectionHeaderContentItem1.innerHTML = `<label>Section Header</label>`;
    sectionHeader.appendChild(sectionHeaderContentItem1);
    innerGrid.appendChild(sectionHeader);

    // field item1 (textbox)
    const fieldItem1 = document.createElement('div');
    fieldItem1.classList.add('grid-stack-item');
    fieldItem1.classList.add('field-grid-stack-item');
    fieldItem1.innerHTML = `
        <div class="field-options-box">
    <p>X</p>
    <p>X</p>
    <p>X</p>
    <p>X</p>
    <p>X</p>
    </div>`;
    fieldItem1.setAttribute('gs-x', '0');
    fieldItem1.setAttribute('gs-y', '0');
    fieldItem1.setAttribute('gs-w', '18');
    fieldItem1.setAttribute('gs-h', '1');

    const fieldContentItem1 = document.createElement('div');
    fieldContentItem1.classList.add('inner-grid-stack-item-content');
    fieldContentItem1.innerHTML =
      `
    <label class="inner-grid-label" for="text1">Text Field` +
      this.itemCount +
      `</label>
    <input id="text` +
      this.itemCount +
      `" type="text" placeholder="Text Field" class="inner-grid-textbox">
    `;

    fieldItem1.appendChild(fieldContentItem1);
    innerGrid.appendChild(fieldItem1);
    content.appendChild(innerGrid);
    item.appendChild(content);

    // Add the section to the main grid
    //this.grid.addWidget(item);
    this.grid.el.appendChild(item);
    this.grid.makeWidget(item);

    // Initialize the nested grid
    GridStack.init(
      {
        column: this.columnNum,
        cellHeight: 20,
        margin: 5,
        disableDrag: false,
        disableResize: false,
        removable: false,
        acceptWidgets: (el) => {
          return el.classList.contains('field-grid-stack-item');
        },
      },
      innerGrid
    );
  }

  addItem() {
    this.itemCount++;

    const w = this.columnNum;
    const h = 2;

    const nodes = this.grid.engine.nodes;
    const lastY = nodes.reduce((max, node) => {
      const y = (node.y ?? 0) + (node.h ?? 0);
      return Math.max(max, y);
    }, 0);

    // Outer section item
    const item = document.createElement('div');
    item.classList.add('grid-stack-item');
    item.setAttribute('gs-x', '0');
    item.setAttribute('gs-y', lastY.toString());
    item.setAttribute('gs-w', w.toString());
    item.setAttribute('gs-h', h.toString());

    // Outer content wrapper
    const content = document.createElement('div');
    content.classList.add('grid-stack-item-content');

    // Inner nested grid for fields
    const innerGrid = document.createElement('div');
    innerGrid.classList.add('grid-stack');
    innerGrid.setAttribute('data-gs-nested', 'true');

    // header item (fixed)
    const sectionHeader = document.createElement('div');
    sectionHeader.classList.add(
      'grid-stack-item',
      'field-grid-stack-fixed-header'
    );
    sectionHeader.innerHTML = ``;
    sectionHeader.setAttribute('gs-x', '0');
    sectionHeader.setAttribute('gs-y', '0');
    sectionHeader.setAttribute('gs-w', (this.columnNum - 1).toString());
    sectionHeader.setAttribute('gs-h', '1'); // give it height 1 so it's visible

    // disable drag + resize
    sectionHeader.setAttribute('gs-no-move', 'true');
    sectionHeader.setAttribute('gs-no-resize', 'true');
    sectionHeader.setAttribute('gs-locked', 'true');

    const sectionHeaderContentItem1 = document.createElement('div');
    sectionHeaderContentItem1.classList.add('inner-grid-stack-item-content');
    sectionHeaderContentItem1.innerHTML = `<label>Section Header</label>`;
    sectionHeader.appendChild(sectionHeaderContentItem1);
    innerGrid.appendChild(sectionHeader);

    // field item1 (textbox)
    const fieldItem1 = document.createElement('div');
    fieldItem1.classList.add('grid-stack-item');
    fieldItem1.classList.add('field-grid-stack-item');
    fieldItem1.innerHTML = `
        <div class="field-options-box">
    <p>X</p>
    <p>X</p>
    <p>X</p>
    <p>X</p>
    <p>X</p>
    </div>`;
    fieldItem1.setAttribute('gs-x', '0');
    fieldItem1.setAttribute('gs-y', '0');
    fieldItem1.setAttribute('gs-w', '17');
    fieldItem1.setAttribute('gs-h', '5');

    const fieldContentItem1 = document.createElement('div');
    fieldContentItem1.classList.add('inner-grid-stack-item-content');
    fieldContentItem1.innerHTML =
      `
    <label class="inner-grid-label" for="text1">Text Field` +
      this.itemCount +
      `</label>
    <input id="text` +
      this.itemCount +
      `" type="text" placeholder="Text Field" class="inner-grid-textbox">
    `;

    fieldItem1.appendChild(fieldContentItem1);
    innerGrid.appendChild(fieldItem1);
    content.appendChild(innerGrid);
    item.appendChild(content);

    // Add the section to the main grid
    //this.grid.addWidget(item);
    this.grid.el.appendChild(item);
    this.grid.makeWidget(item);

    // Initialize the nested grid
    GridStack.init(
      {
        column: this.columnNum,
        cellHeight: 20,
        margin: 5,
        disableDrag: false,
        disableResize: false,
        removable: false,
        acceptWidgets: (el) => {
          return el.classList.contains('field-grid-stack-item');
        },
      },
      innerGrid
    );
  }
}
