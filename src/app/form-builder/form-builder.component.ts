import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GridStack } from 'gridstack';
import { FormsModule } from '@angular/forms';
import {
  FieldServicesService,
  ActionTypes,
} from '../services/field-services.service';
import { FieldSettingsComponent } from '../field-settings/field-settings.component';

export interface sectionCorners {
  sectionId: string;
  topRight: { x: number; y: number };
  topLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}

interface FieldConfig {
  id: string;
  type: ActionTypes;
  label: string;
  placeholder: string;
  size: number;
  options?: string[];
  minRange?: number;
  maxRange?: number;
  required: boolean;
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [FormsModule, FieldSettingsComponent],
  templateUrl: './form-builder.component.html',
  styleUrl: './form-builder.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FormBuilderComponent implements AfterViewInit {
  grid!: GridStack;
  itemCount = 0;
  columnNum = 36;
  innerGrids: Map<string, GridStack> = new Map();
  ddlURL: string = '';
  tableURL: string = '';
  fieldId: string = '';
  fieldType: string = '';
  ActionTypes = ActionTypes;
  currentPage: number = 1;
  rowsPerPage: number = 5;
  // activeFieldId: string | null = null;

  constructor(private fieldService: FieldServicesService) {}
  ngAfterViewInit(): void {
    this.grid = GridStack.init({
      column: this.columnNum,
      row: 36,
      cellHeight: 100,
      margin: 5,
      float: false,
    });

    const canvas = document.querySelector('.canvas');

    if (canvas) {
      canvas.addEventListener('click', (event) => {
        const mouseEvent = event as MouseEvent;
        const target = mouseEvent.target as HTMLElement;

        const isInsideFieldItem = target.closest('.field-grid-stack-item');

        if (!isInsideFieldItem) {
          const activeItems = canvas.querySelectorAll(
            '.field-grid-stack-item.active'
          );
          activeItems.forEach((item) => item.classList.remove('active'));
          this.fieldId = '';
        }
      });
    }
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

  addFieldToSection(innerGridId: string, actionType: ActionTypes): void {
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

    const fieldItem = this.fieldService.fieldCreationGateway(
      {
        x: nextX,
        y: nextY,
        w: fieldWidth,
        h: 5,
        count: this.itemCount,
      },
      actionType
    );

    //add box of settings
    const box = document.createElement('div');
    box.classList.add('field-options-box', 'data-gs-cancel');
    box.innerHTML = `<p class="delete-btn">X</p><p>X</p><p>X</p><p>X</p>`;
    box.querySelector('.delete-btn')?.addEventListener('click', () => {
      fieldItem.remove(); // Just call the passed function
    });
    fieldItem.appendChild(box);

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

      const fieldElement = fieldItem.querySelector('[data-field-type]');
      const fieldType = fieldElement!.getAttribute('data-field-type');

      this.fieldId = fieldElement!.id;
      this.fieldType = fieldType!;
    });

    innerGrid.el.appendChild(fieldItem);
    innerGrid.makeWidget(fieldItem);

    setTimeout(() => {
      const contentElement = fieldItem.querySelector(
        '.inner-grid-stack-item-content'
      ) as HTMLElement;

      if (contentElement) {
        const contentHeight = contentElement.offsetHeight;
        const cellHeight = innerGrid.getCellHeight(true);
        const newH = Math.ceil(contentHeight / cellHeight);
        innerGrid.update(fieldItem, { h: newH });
      }
    }, 0);
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

    if (droppedInSection) {
      switch (actionType) {
        case ActionTypes.shortText.toString():
          this.addFieldToSection(
            droppedInSection.sectionId,
            ActionTypes.shortText
          );
          break;
        case ActionTypes.radioGroup.toString():
          this.addFieldToSection(
            droppedInSection.sectionId,
            ActionTypes.radioGroup
          );
          break;
        case ActionTypes.dropDownList.toString():
          this.addFieldToSection(
            droppedInSection.sectionId,
            ActionTypes.dropDownList
          );
          break;
        case ActionTypes.checkbox.toString():
          this.addFieldToSection(
            droppedInSection.sectionId,
            ActionTypes.checkbox
          );
          break;
        case ActionTypes.table.toString():
          this.addFieldToSection(droppedInSection.sectionId, ActionTypes.table);
          break;
      }
    }
    console.log('Section corners:', sections);
  }

  getDataDDL() {
    fetch(this.ddlURL)
      .then((res) => res.json())
      .then((data) => {
        const ddl = document.getElementById('ddl1') as HTMLSelectElement;
        if (ddl) {
          ddl.innerHTML = '';
          data.forEach((item: any) => {
            const option = document.createElement('option');
            option.value = item.id;
            option.text = item.label;
            ddl.appendChild(option);
          });
        }
      })
      .catch((err) => console.error('Error:', err));
  }

  ddlData: any = [];
  keyValue: { key: string; value: string } = { key: '', value: '' };
  testDDLURL() {
    fetch(this.ddlURL)
      .then((res) => res.json())
      .then((data) => {
        const keys: string[] = Object.keys(data[0]);
        const ddlKeys = document.getElementById(
          'ddl-keys'
        ) as HTMLSelectElement;
        const ddlValues = document.getElementById(
          'ddl-values'
        ) as HTMLSelectElement;
        ddlKeys.innerHTML = '';
        ddlValues.innerHTML = '';
        ddlKeys.appendChild(
          Object.assign(document.createElement('option'), {
            text: 'select key',
            disabled: true,
            selected: true,
          })
        );
        ddlValues.appendChild(
          Object.assign(document.createElement('option'), {
            text: 'select value',
            disabled: true,
            selected: true,
          })
        );
        keys.forEach((item: string) => {
          const option1 = document.createElement('option');
          const option2 = document.createElement('option');
          option1.value = item;
          option1.text = item;
          option2.value = item;
          option2.text = item;
          ddlKeys.appendChild(option1);
          ddlValues.appendChild(option2);
          this.ddlData = data;
        });

        ddlKeys.onchange = (e) => {
          const selectedKey = (e.target as HTMLSelectElement).value;
          this.keyValue.key = selectedKey;
        };

        ddlValues.onchange = (e) => {
          const selectedValue = (e.target as HTMLSelectElement).value;
          this.keyValue.value = selectedValue;
        };
      })
      .catch((err) => console.error('Error:', err));
  }

  tableData: any = [];
  tableKeys: string[] = [];
  testTableURL() {
    fetch(this.tableURL)
      .then((res) => res.json())
      .then((data) => {
        this.tableData = data;
        const keys: string[] = Object.keys(data[0]);
        this.tableKeys = keys;
      })
      .catch((err) => console.error('Error:', err));
  }

  previewData() {
    const ddl = document.getElementById('ddl-preview') as HTMLSelectElement;
    if (ddl) {
      ddl.innerHTML = '';
      this.ddlData.forEach((item: any) => {
        const option = document.createElement('option');
        option.value = item[this.keyValue.key.toString()];
        option.text = item[this.keyValue.value.toString()];
        ddl.appendChild(option);
      });
    }
  }

  saveDDL() {
    const ddl = document.getElementById(this.fieldId) as HTMLSelectElement;
    if (ddl) {
      ddl.innerHTML = '';
      this.ddlData.forEach((item: any) => {
        const option = document.createElement('option');
        option.value = item[this.keyValue.key.toString()];
        option.text = item[this.keyValue.value.toString()];
        ddl.appendChild(option);
      });
    }
  }

  saveTable() {
    const table = document.getElementById(this.fieldId) as HTMLTableElement;
    if (!table) return;

    // Remove old thead and tbody
    const oldThead = table.querySelector('thead');
    const oldTbody = table.querySelector('tbody');
    if (oldThead) table.removeChild(oldThead);
    if (oldTbody) table.removeChild(oldTbody);

    // Remove old pagination container (if any)
    const oldPagination = table.parentElement?.querySelector(
      '.pagination-container'
    );
    if (oldPagination) oldPagination.remove();

    // Get selected columns from dropdowns
    const selectedColumns: string[] = [];
    const selects = document.querySelectorAll(
      'select[id^="table-ddl-column-"]'
    );
    selects.forEach((select) => {
      selectedColumns.push((select as HTMLSelectElement).value);
    });

    this.createTableHeader(table, selectedColumns);
    this.renderTableBody(table, selectedColumns, this.currentPage);

    // find pagination container
    let pagination = table.parentElement?.parentElement?.querySelector(
      '.pagination'
    ) as HTMLElement;

    this.renderPagination(selectedColumns, pagination);

    this.resizeFieldItem(this.fieldId);
  }

  createTableHeader(table: HTMLTableElement, selectedColumns: string[]) {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const col of selectedColumns) {
      const th = document.createElement('th');
      th.textContent = col;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
  }

  renderTableBody(
    table: HTMLTableElement,
    selectedColumns: string[],
    page: number
  ) {
    const oldTbody = table.querySelector('tbody');
    if (oldTbody) table.removeChild(oldTbody);

    const tbody = document.createElement('tbody');
    const start = (page - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    const pageData = this.tableData.slice(start, end);

    for (const row of pageData) {
      const tr = document.createElement('tr');
      for (const col of selectedColumns) {
        const td = document.createElement('td');
        td.textContent = row[col];
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
  }

  renderPagination(selectedColumns: string[], paginationDiv: HTMLElement) {
    paginationDiv.innerHTML = ''; // Clear old buttons

    const totalPages = Math.ceil(this.tableData.length / this.rowsPerPage);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i.toString();
      btn.classList.toggle('active', i === this.currentPage);

      btn.addEventListener('click', () => {
        this.currentPage = i;

        const table = document.getElementById(this.fieldId) as HTMLTableElement;
        if (!table) return;

        this.renderTableBody(table, selectedColumns, i);
        this.renderPagination(selectedColumns, paginationDiv);
        this.resizeFieldItem(this.fieldId);
      });

      paginationDiv.appendChild(btn);
    }
  }

  resizeFieldItem(fieldId: string): void {
    setTimeout(() => {
      const fieldItem = document
        .getElementById(fieldId)
        ?.closest('.grid-stack-item') as HTMLElement;
      if (!fieldItem) return;

      const contentElement = fieldItem.querySelector(
        '.inner-grid-stack-item-content'
      ) as HTMLElement;
      if (!contentElement) return;

      const innerGridEl = fieldItem.closest('.grid-stack') as HTMLElement;
      if (!innerGridEl) return;

      // Get GridStack instance dynamically
      const innerGrid = (innerGridEl as any).gridstack as GridStack;
      if (!innerGrid) {
        console.warn('GridStack instance not found for inner grid element');
        return;
      }

      const contentHeight = contentElement.offsetHeight;
      const cellHeight = innerGrid.getCellHeight(true);
      const newH = Math.ceil(contentHeight / cellHeight);

      innerGrid.update(fieldItem, { h: newH });
    }, 0);
  }

  deleteField() {
    debugger;
  }
}
