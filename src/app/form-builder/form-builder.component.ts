import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GridStack, GridStackElement } from 'gridstack';
import { FormsModule } from '@angular/forms';
import { FieldServicesService } from '../services/field-services.service';
import { RouterModule } from '@angular/router';
import { SettingsComponentComponent } from '../settings-component/settings-component.component';
import { sectionCorners } from '../shared/interfaces/section-corners';
import { ActionTypes } from '../shared/enums/action-types';
import { FieldSettings } from '../shared/interfaces/field-settings';

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [FormsModule, RouterModule, SettingsComponentComponent],
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
  readonly cellHeight = 20;
  readonly margin = 5;

  constructor(private fieldService: FieldServicesService) {}
  ngAfterViewInit(): void {
    this.grid = GridStack.init({
      column: this.columnNum,
      cellHeight: this.cellHeight,
      margin: this.margin,
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

    this.grid.on('change', (event, items) => {
      items.forEach((item) => {
        const el = item.el as HTMLElement;

        const gridstackEl = el.parentElement;
        const gridstack =
        gridstackEl && ((gridstackEl as any).gridstack as GridStack);

        if(gridstack) gridstack.compact();
        
        // Step 1: Check if this item contains a field grid
        const innerGridEl = el.parentElement?.parentElement?.parentElement; // child field grid inside section
        if (!innerGridEl) return;

        const sectionItem = document
        .getElementById(innerGridEl.id)
        ?.closest('.grid-stack-item') as HTMLElement;

        this.resizeSection(innerGridEl.id);
      });
    });
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
    item.setAttribute('gs-id', innerGridId);
    item.innerHTML = `<div class="close-section">
        <img src="/icons/close.png" alt="close" />
      </div>`;
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

    // ✅ Force height update after adding the widget
    (this.grid as any)._updateContainerHeight();

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

    const fieldWidth = 18;
    const columnCount = this.columnNum;
    const existingNodes = innerGrid.engine.nodes || [];

    let nextX = 0;
    let nextY = 1;

    if (existingNodes.length > 0) {
      const last = existingNodes[existingNodes.length - 1];
      const lastX = last.x ?? 0;
      const lastY = last.y ?? 0;
      const lastW = last.w ?? fieldWidth;

      if (lastX + lastW + fieldWidth > columnCount) {
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

    // ✅ Add default settings at creation
    const fieldElement = fieldItem.querySelector('[data-field-type]');
    const fieldId = fieldElement?.id;

    if (fieldElement && fieldId) {
      const defaultSettings = this.getDefaultSettingsByType(
        fieldId,
        actionType
      );
      const exists = this.fieldSettingsList.some((f) => f.fieldId === fieldId);
      if (!exists) {
        this.fieldSettingsList.push(defaultSettings);
      }
    }

    // Add settings box
    const box = document.createElement('div');
    box.classList.add('field-options-box', 'data-gs-cancel');
    box.innerHTML = `<p class="delete-btn">X</p><p>X</p><p>X</p><p>X</p>`;
    box.querySelector('.delete-btn')?.addEventListener('click', () => {
      this.grid.removeWidget(fieldItem);
    });
    fieldItem.appendChild(box);

    // Click to activate and load settings
    fieldItem.addEventListener('click', (event) => {
      event.stopPropagation();

      const allItems = this.grid.el.querySelectorAll(
        '.field-grid-stack-item.active'
      );
      allItems.forEach((item) => item.classList.remove('active'));

      fieldItem.classList.add('active');

      const fieldType = fieldElement?.getAttribute('data-field-type') || '';
      this.fieldId = fieldElement!.id;
      this.fieldType = fieldType;
      //defult values on the fields settings
      if (fieldElement) {
        this.selectedFieldSettings = {
          fieldId: this.fieldId,
          fieldType: fieldType,
          fieldName: '',
          fieldLabel: fieldElement.getAttribute('data-label') || '',
          fieldSize: ((): 'medium' | 'small' | 'large' | 'full' | undefined => {
            const size = fieldElement.getAttribute('data-size');
            return size === 'medium' ||
              size === 'small' ||
              size === 'large' ||
              size === 'full'
              ? size
              : 'medium';
          })(),
          placeholderText: fieldElement.getAttribute('data-placeholder') || '',
          defaultValue: fieldElement.getAttribute('data-default') || '',
          minRange: +fieldElement.getAttribute('data-min')! || undefined,
          maxRange: +fieldElement.getAttribute('data-max')! || undefined,
          cssClass: fieldElement.getAttribute('data-css') || '',
          isRequired: fieldElement.getAttribute('data-required') === 'true',
          options: JSON.parse(
            fieldElement.getAttribute('data-options') || '[]'
          ),
        };
      } else {
        this.selectedFieldSettings = {};
      }
    });

    innerGrid.el.appendChild(fieldItem);
    innerGrid.makeWidget(fieldItem);

    this.resizeField(fieldItem.id);
    this.resizeSection(innerGridId);
  }

  //the defult values that get sent to the preview
  getDefaultSettingsByType(fieldId: string, type: ActionTypes): FieldSettings {
    const base: FieldSettings = {
      fieldId,
      fieldType: type,
      fieldName: 'fieldName',
      fieldLabel: 'Field Label',
      fieldSize: 'medium',
      isRequired: false,
      cssClass: '',
    };

    switch (type) {
      case ActionTypes.shortText:
        return {
          ...base,
          placeholderText: 'placeholder',
          defaultValue: '',
          minRange: undefined,
          maxRange: undefined,
        };

      case ActionTypes.dropDownList:
      case ActionTypes.checkbox:
      case ActionTypes.radioGroup:
        return {
          ...base,
          options: [],
        };

      default:
        return {
          fieldId,
          fieldType: type,
          fieldName: 'fieldName',
          fieldLabel: 'Field Label',
          fieldSize: 'medium',
          cssClass: '',
          isRequired: false,
          defaultValue: '',
          options: [],
        };
    }
  }

  generateFieldName(label: string): string {
    if (!label) return 'field';
    return label
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  getCompleteFieldSettings(field: Partial<FieldSettings>): FieldSettings {
    const defaults: FieldSettings = {
      fieldId: field.fieldId || 'unknown-id',
      fieldLabel: field.fieldLabel || 'Field Label',
      fieldName: this.generateFieldName(field.fieldLabel || 'fieldName'),
      fieldType: field.fieldType || ActionTypes.shortText,
      fieldSize: field.fieldSize || 'medium',
      cssClass: field.cssClass || '',
      isRequired: field.isRequired ?? false,
      defaultValue: '',
      placeholderText: '',
      minRange: undefined,
      maxRange: undefined,
      options: [],
    };

    // Merge and override defaults with passed field
    const merged = { ...defaults, ...field };

    // For shortText, ensure defaultValue, placeholder, min/max are set
    if (merged.fieldType === ActionTypes.shortText) {
      merged.defaultValue = field.defaultValue ?? '';
      merged.placeholderText = field.placeholderText ?? '';
      merged.minRange = field.minRange;
      merged.maxRange = field.maxRange;
    }

    // For dropdown, checkbox, radio, ensure options array
    if (
      merged.fieldType === ActionTypes.dropDownList ||
      merged.fieldType === ActionTypes.checkbox ||
      merged.fieldType === ActionTypes.radioGroup
    ) {
      merged.options = field.options || [];
    }

    return merged;
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
    // console.log('Section corners:', sections);
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
    this.resizeField(this.fieldId);
    const ids = this.getGridHierarchyByFieldId(this.fieldId);
    if (ids.sectionGridId) this.resizeSection(ids.sectionGridId);
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
        this.resizeField(this.fieldId);
      });

      paginationDiv.appendChild(btn);
    }
  }

  resizeField(fieldId: string): void {
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

  resizeSection(sectionId: string): void {
    setTimeout(() => {
      const sectionItem = document
        .getElementById(sectionId)
        ?.closest('.grid-stack-item') as HTMLElement;
      if (!sectionItem) return;

      const innerGridEl = sectionItem.querySelector(
        '.grid-stack'
      ) as HTMLElement;
      if (!innerGridEl) return;

      const innerGrid = (innerGridEl as any).gridstack as GridStack;
      const outerGridEl = sectionItem.closest('.grid-stack') as HTMLElement;
      const outerGrid =
        outerGridEl && ((outerGridEl as any).gridstack as GridStack);
      if (!innerGrid || !outerGrid) return;

      // Optional: get header height in rows
      const headerEl = sectionItem.querySelector(
        '.section-header'
      ) as HTMLElement;
      const headerPx = headerEl?.offsetHeight ?? 0;
      const rowHeight = outerGrid.getCellHeight(true);
      const headerRows = Math.ceil(headerPx / rowHeight);

      // Find bottom-most occupied row (y + h)
      let maxBottom = 0;
      for (const node of innerGrid.engine.nodes) {
        const bottom = (node?.y ?? 0) + (node?.h ?? 0);
        if (bottom > maxBottom) maxBottom = bottom;
      }

      const newH = headerRows + maxBottom;
      outerGrid.compact();
      outerGrid.update(sectionItem, { h: newH + 2 });
      
    }, 0);
  }

  previewJson() {
    const sections: {
      id: string;
      fields: { id: string; json: FieldSettings }[];
    }[] = [];

    const outerNodes = this.grid.save();
    if (!Array.isArray(outerNodes)) return;

    outerNodes.forEach((outerNode) => {
      const sectionId = outerNode.id;
      if (!sectionId) return;

      const sectionEl = document.querySelector(`[gs-id="${sectionId}"]`);
      if (!sectionEl) return;

      const sectionGridEl = sectionEl.querySelector('.grid-stack');
      if (!sectionGridEl) return;

      const innerGrid = this.innerGrids.get(sectionId);
      if (!innerGrid) return;

      const fields: { id: string; json: FieldSettings }[] = [];

      const innerNodes = innerGrid.save();
      if (Array.isArray(innerNodes)) {
        innerNodes.forEach((node) => {
          const fieldId = node.id;
          if (!fieldId) return;

          const fieldEl = sectionGridEl.querySelector(`[gs-id="${fieldId}"]`);
          if (!fieldEl) return;

          const parsed = this.parseFieldHtml(fieldEl.innerHTML.trim());

          const settings = this.fieldSettingsList.find(
            (f) => f.fieldId === parsed?.fieldId
          );

          const fullSettings = this.getCompleteFieldSettings({
            ...parsed,
            ...(settings || {}),
          });

          fields.push({
            id: fieldId,
            json: fullSettings,
          });
        });
      }

      sections.push({
        id: sectionId,
        fields,
      });
    });

    localStorage.setItem('form-sections', JSON.stringify(sections));
    window.open('/preview', '_blank');
    console.log('sections', sections);
  }

  parseFieldHtml(html: string): any {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const input = tempDiv.querySelector('input, select, textarea') as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    const label = tempDiv.querySelector('label');

    if (!input) return null;

    const typeAttr = input.getAttribute('type');
    const tagName = input.tagName.toLowerCase();

    // const type = typeAttr || tagName;

    const groupLabel =
      tempDiv.querySelector('.inner-grid-label')?.textContent?.trim() || '';

    const json: FieldSettings = {
      fieldType:
        tagName === 'select'
          ? 'select'
          : typeAttr === 'radio'
          ? 'radio'
          : typeAttr === 'checkbox'
          ? 'checkbox'
          : 'text',
      fieldLabel: groupLabel || '',
      fieldName: label?.textContent?.trim() || '',
      fieldId: input.id,
      isRequired: input.hasAttribute('required'),
      fieldSize: 'medium',
      placeholderText: input.getAttribute('placeholder') || '',
      defaultValue: (input as HTMLInputElement).value || '',
    };

    if (json.fieldType === 'text') {
      const minAttr = input.getAttribute('min');
      const maxAttr = input.getAttribute('max');

      json.minRange = minAttr ? Number(minAttr) : undefined;
      json.maxRange = maxAttr ? Number(maxAttr) : undefined;
    }

    if (json.fieldType === 'select') {
      json.options = [];
      tempDiv.querySelectorAll('option').forEach((opt) => {
        const option = opt as HTMLOptionElement;
        (json.options ??= []).push({
          value: option.value,
          label: option.textContent?.trim() || '',
        });
      });
    }

    if (json.fieldType === 'radio' || json.fieldType === 'checkbox') {
      json.options = [];
      tempDiv
        .querySelectorAll('input[type="radio"], input[type="checkbox"]')
        .forEach((opt) => {
          const input = opt as HTMLInputElement;
          const optLabel = tempDiv.querySelector(`label[for="${input.id}"]`);
          (json.options ??= []).push({
            value: input.value || input.id,
            label: optLabel?.textContent?.trim() || '',
          });
        });
      if (json.fieldType === 'radio') json.direction = 'vertical';
    }

    return json;
  }

  selectedFieldSettings: Partial<FieldSettings> = {};
  fieldSettingsList: FieldSettings[] = [];

  onFieldUpdated(event: FieldSettings) {
    const el = document.getElementById(event.fieldId);
    if (!el) return;

    // Find current settings (if exist)
    const currentIndex = this.fieldSettingsList.findIndex(
      (f) => f.fieldId === event.fieldId
    );

    const existing =
      currentIndex !== -1 ? this.fieldSettingsList[currentIndex] : {};

    const updatedField: FieldSettings = {
      ...existing,
      ...event,
    };

    // Update DOM attributes
    el.setAttribute('data-label', updatedField.fieldLabel ?? 'Field Label');
    el.setAttribute('data-size', updatedField.fieldSize ?? '');
    el.setAttribute('data-css', updatedField.cssClass ?? '');
    el.setAttribute(
      'data-required',
      updatedField.isRequired?.toString() || 'false'
    );

    switch (updatedField.fieldType) {
      case ActionTypes.shortText:
        el.setAttribute('data-default', updatedField.defaultValue ?? '');
        el.setAttribute('data-placeholder', updatedField.placeholderText ?? '');
        el.setAttribute('data-min', updatedField.minRange?.toString() || '');
        el.setAttribute('data-max', updatedField.maxRange?.toString() || '');
        break;

      case ActionTypes.dropDownList:
      case ActionTypes.checkbox:
      case ActionTypes.radioGroup:
        el.setAttribute(
          'data-options',
          JSON.stringify(updatedField.options || [])
        );
        break;

      default:
        break;
    }

    if (currentIndex !== -1) {
      this.fieldSettingsList[currentIndex] = updatedField;
    } else {
      this.fieldSettingsList.push(updatedField);
    }

    if (this.selectedFieldSettings?.fieldId === event.fieldId) {
      this.selectedFieldSettings = updatedField;
    }
  }

  checkSettings() {
    console.log('settings', this.fieldSettingsList);
  }

  removeField(innerGridId: string, fieldId: string) {
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

    // Remove widget and compact layout
    innerGrid.removeWidget(fieldItem);
    innerGrid.compact();
    this.resizeSection(innerGridId);
  }

  getGridHierarchyByFieldId(fieldId: string): {
    fieldGridId: string | null;
    sectionGridId: string | null;
  } {
    const fieldEl = document.getElementById(fieldId);
    if (!fieldEl) return { fieldGridId: null, sectionGridId: null };

    const fieldItem = fieldEl.closest('.grid-stack-item') as HTMLElement;
    if (!fieldItem) return { fieldGridId: null, sectionGridId: null };

    //const test = fieldItem.parentElement.parentElement.parentElement.id
    const fieldGridId = fieldItem.id;
    const sectionGridId =
      fieldItem.parentElement?.parentElement?.parentElement?.id;
    if (!sectionGridId)
      return { fieldGridId: fieldGridId, sectionGridId: null };

    return { fieldGridId, sectionGridId };
  }
}
