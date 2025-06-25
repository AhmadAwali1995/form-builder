import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GridStack } from 'gridstack';
import { FieldServicesService, ActionTypes } from '../services/field-services.service';

export interface sectionCorners {
  sectionId: string;
  topRight: { x: number; y: number };
  topLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
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
  innerGrids: Map<string, GridStack> = new Map();

  constructor(private fieldService: FieldServicesService) {}
  ngAfterViewInit(): void {
    this.grid = GridStack.init({
      column: this.columnNum,
      row: 36,
      cellHeight: 100,
      margin: 5,
      float: false,
    });

    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is inside any .field-grid-stack-item
      const isInsideFieldItem = target.closest('.field-grid-stack-item');

      if (!isInsideFieldItem) {
        // Remove active class from all field-grid-stack-item elements
        const activeItems = this.grid.el.querySelectorAll(
          '.field-grid-stack-item.active'
        );
        activeItems.forEach((item) => item.classList.remove('active'));
      }
    });

    this.grid.on('dragstart', (event, el) => {
      const activeItems = this.grid.el.querySelectorAll(
        '.field-grid-stack-item.active'
      );
      activeItems.forEach((item) => item.classList.remove('active'));
    });

    this.grid.on('dragstop', (event, el) => {});
  }

  addItem() {
    this.itemCount++;

    const w = this.columnNum;
    const h = 8;

    const nodes = this.grid.engine.nodes;
    const lastY = nodes.reduce((max, node) => {
      const y = (node.y ?? 0) + (node.h ?? 0);
      return Math.max(max, y);
    }, 0);

    const innerGridId = `inner-grid-${this.itemCount}`;

    // Outer section item
    const item = document.createElement('div');
    item.classList.add('grid-stack-item');
    item.setAttribute('gs-x', '0');
    item.setAttribute('gs-y', lastY.toString());
    item.setAttribute('gs-w', w.toString());
    item.setAttribute('gs-h', h.toString());
    item.setAttribute('id', innerGridId);

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
    sectionHeaderContentItem1.addEventListener('click', () => {
      this.addTextFieldToSection(innerGridId);
    });
    sectionHeader.appendChild(sectionHeaderContentItem1);
    innerGrid.appendChild(sectionHeader);

    content.appendChild(innerGrid);
    item.appendChild(content); //for header

    this.grid.el.appendChild(item);
    this.grid.makeWidget(item);

    // Initialize the nested grid
    const grid = GridStack.init(
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
    this.innerGrids.set(innerGridId, grid);
  }

  addTextFieldToSection1(innerGridId: string): void {
    const innerGrid = this.innerGrids.get(innerGridId);
    if (!innerGrid) {
      console.warn('No grid found for ID:', innerGridId);
      return;
    }

    const fieldWidth = 17.8; // GridStack columns per field (adjust to fit your layout)
    const columnCount = this.columnNum;
    const existingNodes = innerGrid.engine.nodes || [];

    let nextX = 0;
    let nextY = 1; // Start after header row (row 0 is header)

    if (existingNodes.length > 0) {
      const last = existingNodes[existingNodes.length - 1];

      const lastX = last.x ?? 0;
      const lastY = last.y ?? 0;
      const lastW = last.w ?? fieldWidth;

      // Calculate next position
      if (lastX + lastW + fieldWidth > columnCount) {
        // Wrap to next row
        nextX = 0;
        nextY = lastY + (last.h ?? 1);
      } else {
        nextX = lastX + lastW;
        nextY = lastY;
      }
    }

    // field item1 (textbox)
    const fieldItem = document.createElement('div');
    fieldItem.classList.add('grid-stack-item', 'field-grid-stack-item');
    fieldItem.setAttribute('gs-x', nextX.toString());
    fieldItem.setAttribute('gs-y', nextY.toString());
    fieldItem.setAttribute('gs-w', fieldWidth.toString());
    fieldItem.setAttribute('gs-h', '5');

    // Add click event to field item This will make it active when clicked
    fieldItem.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent document click handler from firing

      // Remove active from others
      const allItems = this.grid.el.querySelectorAll(
        '.field-grid-stack-item.active'
      );
      allItems.forEach((item) => item.classList.remove('active'));

      // Add active to this
      fieldItem.classList.add('active');
    });

    // Create options box for field item, this will be shown when the field item is clicked
    const fieldOptionsBox = document.createElement('div');
    fieldOptionsBox.classList.add('field-options-box');
    fieldOptionsBox.classList.add('data-gs-cancel');
    fieldOptionsBox.innerHTML = `
    <p>X</p>
    <p>X</p>
    <p>X</p>
    <p>X</p>
    <p>X</p>`;

    const fieldContentItem1 = document.createElement('div');
    fieldContentItem1.classList.add('inner-grid-stack-item-content');
    fieldContentItem1.innerHTML = `
  <label class="inner-grid-label" for="text1">Text Field</label>
  <input id="text${this.itemCount}" type="text" placeholder="Text Field" class="inner-grid-textbox" >
  `;
    fieldContentItem1.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem1);
    innerGrid.el.appendChild(fieldItem);
    innerGrid.makeWidget(fieldItem);
  }

  addTextFieldToSection(innerGridId: string): void {
    const innerGrid = this.innerGrids.get(innerGridId);
    if (!innerGrid) {
      console.warn('No grid found for ID:', innerGridId);
      return;
    }

    const fieldWidth = 18; // GridStack columns per field (adjust to fit your layout)
    const columnCount = this.columnNum;
    const existingNodes = innerGrid.engine.nodes || [];

    let nextX = 0;
    let nextY = 1; // Start after header row (row 0 is header)

    if (existingNodes.length > 0) {
      const last = existingNodes[existingNodes.length - 1];

      const lastX = last.x ?? 0;
      const lastY = last.y ?? 0;
      const lastW = last.w ?? fieldWidth;

      // Calculate next position
      if (lastX + lastW + fieldWidth > columnCount) {
        // Wrap to next row
        nextX = 0;
        nextY = lastY + (last.h ?? 1);
      } else {
        nextX = lastX + lastW;
        nextY = lastY;
      }
    }

    const fieldItem = this.fieldService.fieldCreationGateway({
      x: nextX,
      y: nextY,
      w: fieldWidth,
      h: 5,
      count: this.itemCount,
    },ActionTypes.dropDownList);
    // Add click event to field item This will make it active when clicked
    fieldItem.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent document click handler from firing

      // Remove active from others
      const allItems = this.grid.el.querySelectorAll(
        '.field-grid-stack-item.active'
      );
      allItems.forEach((item) => item.classList.remove('active'));

      // Add active to this
      fieldItem.classList.add('active');
    });

    innerGrid.el.appendChild(fieldItem);
    innerGrid.makeWidget(fieldItem);
  }

  ghostElement: HTMLElement | null = null;
  startGhostDrag(event: MouseEvent, actionType: string) {
    event.preventDefault();

    // Create ghost element
    this.ghostElement = document.createElement('div');
    this.ghostElement.innerText = actionType;
    this.ghostElement.style.position = 'fixed';
    this.ghostElement.style.top = `${event.clientY}px`;
    this.ghostElement.style.left = `${event.clientX}px`;
    this.ghostElement.style.pointerEvents = 'none';
    this.ghostElement.style.background = 'white';
    this.ghostElement.style.border = '2px solid rgba(128, 128, 128, 0.2)';
    this.ghostElement.style.borderRadius = '7px';
    this.ghostElement.style.padding = '4px 8px';
    this.ghostElement.style.width = '10%';
    this.ghostElement.style.zIndex = '9999';
    this.ghostElement.style.opacity = '0.5';

    document.body.appendChild(this.ghostElement);

    // Track movement
    const onMouseMove = (moveEvent: MouseEvent) => {
      if (this.ghostElement) {
        this.ghostElement.style.top = `${moveEvent.clientY + 5}px`;
        this.ghostElement.style.left = `${moveEvent.clientX + 5}px`;
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      const x = upEvent.clientX;
      const y = upEvent.clientY;
      this.onControlDrop(actionType, { x, y });

      if (this.ghostElement) {
        document.body.removeChild(this.ghostElement);
        this.ghostElement = null;
      }

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onControlDrop(
    actionType: string,
    mouseUpDirection: { x: number; y: number }
  ): void {
    debugger;
    const sections: sectionCorners[] = [];
    this.innerGrids.forEach((grid, sectionId) => {
      const sectionEl = document.getElementById(sectionId);
      if (!sectionEl) return;

      const rect = sectionEl.getBoundingClientRect();

      sections.push({
        sectionId,
        topLeft: { x: rect.left, y: rect.top },
        topRight: { x: rect.right, y: rect.top },
        bottomLeft: { x: rect.left, y: rect.bottom },
        bottomRight: { x: rect.right, y: rect.bottom },
      });
    });

    const droppedInSection = sections.find((section) => {
      const top = section.topLeft.y;
      const bottom = section.bottomLeft.y;
      const left = section.topLeft.x;
      const right = section.topRight.x;

      return (
        mouseUpDirection.x >= left &&
        mouseUpDirection.x <= right &&
        mouseUpDirection.y >= top &&
        mouseUpDirection.y <= bottom
      );
    });

    if (droppedInSection)
      this.addTextFieldToSection(droppedInSection.sectionId);
    console.log('Section corners:', sections);
  }
}
