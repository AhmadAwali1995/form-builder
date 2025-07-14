import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { GridStack, GridStackElement } from 'gridstack';
import { FormsModule } from '@angular/forms';
import { FieldServicesService } from '../services/field-services.service';
import { RouterModule } from '@angular/router';
import { SettingsComponentComponent } from '../settings-component/settings-component.component';
import { sectionCorners } from '../shared/interfaces/section-corners';
import { ActionTypes } from '../shared/enums/action-types';
import { Fields, FieldSettings, Sections } from '../shared/interfaces/sections';

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
  isHeaderExist: boolean = false;
  isFooterExist: boolean = false;
  readonly cellHeight = 20;
  readonly margin = 5;
  sections: Sections[] = [];
  formSaved: boolean = false;

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
          this.ddlURLs = {};
          this.ddlDataMap = {};
          this.keyValueMap = {};
        }
      });
    }

    this.grid.on('added', (event, items) => {
      items.forEach((item) => {
        if (
          item.id?.includes('inner-grid') ||
          item.id?.includes('header') ||
          item.id?.includes('footer')
        )
          return;
        const el = item.el as HTMLElement;

        const gridstackEl = el.parentElement;
        const gridstack =
          gridstackEl && ((gridstackEl as any).gridstack as GridStack);

        if (gridstack) gridstack.compact();
        // Step 1: Check if this item contains a field grid
        const innerGridEl = el.parentElement?.parentElement?.parentElement; // child field grid inside section
        if (!innerGridEl) return;

        const sectionItem = document
          .getElementById(innerGridEl.id)
          ?.closest('.grid-stack-item') as HTMLElement;

        this.resizeSection(innerGridEl.id);
      });
      this.repositionFooter();
    });

    this.grid.on('change', (event, items) => {
      items.forEach((item) => {
        if (
          item.id?.includes('inner-grid') ||
          item.id?.includes('header') ||
          item.id?.includes('footer')
        )
          return;
        const el = item.el as HTMLElement;

        const gridstackEl = el.parentElement;
        const gridstack =
          gridstackEl && ((gridstackEl as any).gridstack as GridStack);

        if (gridstack) gridstack.compact();
        // Step 1: Check if this item contains a field grid
        const innerGridEl = el.parentElement?.parentElement?.parentElement; // child field grid inside section
        if (!innerGridEl) return;

        const sectionItem = document
          .getElementById(innerGridEl.id)
          ?.closest('.grid-stack-item') as HTMLElement;

        this.resizeFieldWidth(item.id, item.w);
        this.resizeSection(innerGridEl.id);
      });

      this.repositionFooter();
    });

    this.grid.on('removed', (event, items) => {
      items.forEach((item) => {
        const el = item.el as HTMLElement;

        const gridstackEl = el.parentElement;
        const gridstack =
          gridstackEl && ((gridstackEl as any).gridstack as GridStack);

        if (gridstack) gridstack.compact();

        const innerGridEl = el.parentElement?.parentElement?.parentElement;
        if (!innerGridEl) return;

        const sectionItem = document
          .getElementById(innerGridEl.id)
          ?.closest('.grid-stack-item') as HTMLElement;

        this.resizeSection(innerGridEl.id);
      });

      this.repositionFooter();
    });
  }

  getFormSections() {
    const sections: Sections[] = [];
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

      const fields: Fields[] = [];

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
            fieldId: fieldId,
            fieldSettings: fullSettings,
          });
        });
      }

      sections.push({
        sectionId: sectionId,
        fields,
      });
    });
    return sections;
  }

  saveForm() {
    this.formSaved = true;

    const sections = this.getFormSections();
    if (sections) {
      this.sections = sections;
      localStorage.setItem('form-sections', JSON.stringify(this.sections));
      return;
    }
    console.error('there is no sections data');
  }

  previewJson() {
    window.open('/preview', '_blank');
  }

  downloadJSON() {
    const sections = this.getFormSections();
    if (sections) {
      const dataStr = JSON.stringify(sections, null, 2); // pretty format
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'form-structure.json';
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
        w:
          actionType === ActionTypes.label || actionType === ActionTypes.table
            ? fieldWidth * 2
            : fieldWidth,
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
    box.innerHTML = `<p class="delete-btn"><img class="delete-icon" src="/icons/delete.png" alt="delete" /></p>`;
    box.querySelector('.delete-btn')?.addEventListener('click', () => {
      this.removeField(innerGridId, fieldId!);
    });
    fieldItem.appendChild(box);

    // Click to activate and load settings
    fieldItem.addEventListener('click', (event) => {
      event.stopPropagation();

      this.emptyKeysDDL();
      this.emptyKeysTable();
      const allItems = this.grid.el.querySelectorAll(
        '.field-grid-stack-item.active'
      );
      allItems.forEach((item) => item.classList.remove('active'));

      fieldItem.classList.add('active');
      const fieldType = fieldElement?.getAttribute('data-field-type') || '';
      this.fieldId = fieldElement!.id;
      this.fieldType = fieldType;
      this.addSettingsToField(fieldElement, fieldType);
    });

    innerGrid.el.appendChild(fieldItem);
    innerGrid.makeWidget(fieldItem);

    this.resizeField(fieldItem.id);
    this.resizeSection(innerGridId);
  }

  addSettingsToField(fieldElement: Element | null, fieldType: string) {
    if (fieldElement) {
      const columnsAttr = fieldElement.getAttribute('data-columns');
      const parsedColumns = columnsAttr ? JSON.parse(columnsAttr) : [];

      this.selectedFieldSettings = {
        fieldId: this.fieldId,
        fieldType: fieldType as ActionTypes,
        fieldLabel: fieldElement.getAttribute('data-label') || '',
        fieldName: this.fieldId,
        fieldSize:
          (fieldElement.getAttribute('data-size') as any) ||
          (fieldType === ActionTypes.label || fieldType === ActionTypes.table
            ? 'full'
            : 'medium'),
        placeholderText: fieldElement.getAttribute('data-placeholder') || '',
        defaultValue: fieldElement.getAttribute('data-default') || '',
        minRange: +fieldElement.getAttribute('data-min')! || undefined,
        maxRange: +fieldElement.getAttribute('data-max')! || undefined,
        cssClass: fieldElement.getAttribute('data-css') || '',
        isRequired: fieldElement.getAttribute('data-required') === 'true',
        options: JSON.parse(
          fieldElement.getAttribute('data-options') ||
            JSON.stringify([
              { label: 'Option 1', value: 'option_1' },
              { label: 'Option 2', value: 'option_2' },
            ])
        ),
        columns: parsedColumns,
      };
    } else {
      this.selectedFieldSettings = {};
    }
  }

  getDefaultSettingsByType(fieldId: string, type: ActionTypes): FieldSettings {
    const base: FieldSettings = {
      fieldId,
      fieldType: type,
      fieldLabel: 'Field Label',
      fieldName: fieldId,
      fieldSize:
        type === ActionTypes.label || type === ActionTypes.table
          ? 'full'
          : 'medium',
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
          options: [
            { label: 'Option 1', value: 'option_1' },
            { label: 'Option 2', value: 'option_2' },
          ],
        };
      case ActionTypes.table:
        return {
          ...base,
          columns: [],
        };
      case ActionTypes.label:
        return {
          ...base,
        };
      default:
        return {
          ...base,
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
      fieldName: field.fieldId || 'unknown-id',
      fieldType: field.fieldType || ActionTypes.shortText,
      fieldSize: field.fieldSize || 'medium',
      cssClass: field.cssClass || '',
      isRequired: field.isRequired ?? false,
      defaultValue: '',
      placeholderText: '',
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
      merged.options = field.options || [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
      ];
    }

    if (merged.fieldType === ActionTypes.table) {
      merged.columns = field.columns || [];
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
        case ActionTypes.label.toString():
          this.addFieldToSection(droppedInSection.sectionId, ActionTypes.label);
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

  ddlURLs: { [key: string]: string } = {};
  ddlDataMap: { [key: string]: any[] } = {};
  keyValueMap: { [key: string]: { key: string; value: string } } = {};

  testDDLURL() {
    const url = this.ddlURLs[this.fieldId];
    if (!url) return;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const keys: string[] = Object.keys(data[0]);

        const ddlKeys = document.getElementById(
          `ddl-keys-${this.fieldId}`
        ) as HTMLSelectElement;
        const ddlValues = document.getElementById(
          `ddl-values-${this.fieldId}`
        ) as HTMLSelectElement;

        if (!ddlKeys || !ddlValues) return;

        // Reset dropdowns
        ddlKeys.innerHTML = '';
        ddlValues.innerHTML = '';

        // Default placeholder
        ddlKeys.appendChild(new Option('Select key', '', true, true));
        ddlValues.appendChild(new Option('Select value', '', true, true));

        // Append real options
        keys.forEach((key) => {
          ddlKeys.appendChild(new Option(key, key));
          ddlValues.appendChild(new Option(key, key));
        });

        // Store the full data for this fieldId
        this.ddlDataMap[this.fieldId] = data;

        // Initialize key-value entry if needed
        if (!this.keyValueMap[this.fieldId]) {
          this.keyValueMap[this.fieldId] = { key: '', value: '' };
        }

        // Set selected values on change
        ddlKeys.onchange = (e) => {
          this.keyValueMap[this.fieldId].key = (
            e.target as HTMLSelectElement
          ).value;
        };

        ddlValues.onchange = (e) => {
          this.keyValueMap[this.fieldId].value = (
            e.target as HTMLSelectElement
          ).value;
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
    const previewDDL = document.getElementById(
      `ddl-preview-${this.fieldId}`
    ) as HTMLSelectElement;
    const data = this.ddlDataMap[this.fieldId] || [];
    const keys = this.keyValueMap[this.fieldId];

    if (!previewDDL || !data || !keys?.key || !keys?.value) return;

    previewDDL.innerHTML = '';
    data.forEach((item) => {
      const option = document.createElement('option');
      option.value = item[keys.key];
      option.text = item[keys.value];
      previewDDL.appendChild(option);
    });
  }

  saveDDL() {
    const data = this.ddlDataMap[this.fieldId] || [];
    const keys = this.keyValueMap[this.fieldId];

    const options = data.map((item) => ({
      value: item[keys.key],
      label: item[keys.value],
    }));

    const ddl = document.getElementById(this.fieldId) as HTMLSelectElement;
    if (ddl) {
      ddl.innerHTML = '';
      options.forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.text = opt.label;
        ddl.appendChild(option);
      });
    }

    const fieldSettings: Partial<FieldSettings> = {
      fieldId: this.fieldId,
      fieldType: ActionTypes.dropDownList,
      options,
    };

    this.onFieldUpdated(fieldSettings as FieldSettings);
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

    const fieldSettings: Partial<FieldSettings> = {
      fieldId: this.fieldId,
      fieldType: ActionTypes.table,
      columns: [
        {
          selectedColumns,
          columnsData: this.tableData,
        },
      ],
    };

    this.onFieldUpdated(fieldSettings as FieldSettings);
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
    // console.log('resizeField consumed');
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
    innerGrid.update(fieldItem, { h: newH, minH: newH, maxH: newH });
    // console.log(`h values h: ${newH}, minH: ${newH}, maxH: ${newH}`);
  }

  resizeFieldWidth(fieldId?: string, currentWidth?: number) {
    // console.log('resizeFieldWidth consumed');
    const fieldItem = document
      .getElementById(fieldId!)
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

    const allowedWidths = [9, 18, 27, 36];

    let newW = 0;
    const curW = currentWidth!;
    if (curW <= 13) {
      newW = allowedWidths[0];
    } else if (curW >= 14 && curW <= 22) {
      newW = allowedWidths[1];
    } else if (curW >= 23 && curW <= 31) {
      newW = allowedWidths[2];
    } else if (curW >= 32) {
      newW = allowedWidths[3];
    }

    innerGrid.update(fieldItem, { w: newW });
    this.resizeField(fieldId!);
    const sectionId = fieldItem.parentElement?.parentElement?.parentElement?.id;
    this.resizeSection(sectionId!);
    // console.log(`w values w: ${newW}`);
  }

  resizeSection(sectionId: string): void {
    // console.log('resizeSection consumed');
    const sectionItem = document
      .getElementById(sectionId)
      ?.closest('.grid-stack-item') as HTMLElement;
    if (!sectionItem) return;

    const innerGridEl = sectionItem.querySelector('.grid-stack') as HTMLElement;
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
    outerGrid.update(sectionItem, {
      h: newH + 3,
    });
  }

  parseFieldHtml(html: string): FieldSettings | null {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const input = tempDiv.querySelector(
      'input, select, p, table, div[data-field-type]'
    ) as HTMLElement;
    if (!input) return null;

    const label = tempDiv.querySelector('label');
    const fieldTypeAttr = input.getAttribute('data-field-type');
    const tagName = input.tagName.toLowerCase();
    const inputType = input.getAttribute('type');

    const getFieldType = (): ActionTypes => {
      if (fieldTypeAttr && fieldTypeAttr in ActionTypes) {
        return fieldTypeAttr as ActionTypes;
      }

      switch (tagName) {
        case 'select':
          return ActionTypes.dropDownList;
        case 'p':
          return ActionTypes.label;
        case 'table':
          return ActionTypes.table;
        case 'input':
          if (inputType === 'checkbox') return ActionTypes.checkbox;
          if (inputType === 'radio') return ActionTypes.radioGroup;
          return ActionTypes.shortText;
        default:
          return ActionTypes.shortText;
      }
    };

    const fieldType = getFieldType();
    const fieldId = input.id || `field-${crypto.randomUUID()}`;
    const fieldLabel =
      tempDiv.querySelector('.inner-grid-label, label')?.textContent?.trim() ||
      '';
    const placeholder = (input as HTMLInputElement).placeholder || '';
    const defaultValue = (input as HTMLInputElement).value || '';

    const json: FieldSettings = {
      fieldType,
      fieldLabel,
      fieldName: fieldId,
      fieldId,
      isRequired: input.hasAttribute('required'),
      fieldSize: 'medium',
      placeholderText: placeholder,
      defaultValue,
    };

    if (fieldType === ActionTypes.shortText) {
      json.minRange = input.getAttribute('min')
        ? +input.getAttribute('min')!
        : undefined;
      json.maxRange = input.getAttribute('max')
        ? +input.getAttribute('max')!
        : undefined;
    }

    if (fieldType === ActionTypes.dropDownList) {
      json.options = Array.from(tempDiv.querySelectorAll('option')).map(
        (opt) => ({
          value: (opt as HTMLOptionElement).value,
          label: opt.textContent?.trim() || '',
        })
      );
    }

    if (
      fieldType === ActionTypes.checkbox ||
      fieldType === ActionTypes.radioGroup
    ) {
      json.options = [];
      const inputs = tempDiv.querySelectorAll(
        'input[type="checkbox"], input[type="radio"]'
      );
      inputs.forEach((input) => {
        const id = input.id;
        const optLabel = tempDiv.querySelector(`label[for="${id}"]`);
        json.options!.push({
          value: (input as HTMLInputElement).value || id,
          label: optLabel?.textContent?.trim() || '',
        });
      });

      if (fieldType === ActionTypes.radioGroup) {
        json.direction = 'vertical';
      }
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
    el.setAttribute('data-name', event.fieldId);
    el.setAttribute('data-size', updatedField.fieldSize ?? '');
    el.setAttribute('data-css', updatedField.cssClass ?? '');
    el.setAttribute(
      'data-required',
      updatedField.isRequired?.toString() || 'false'
    );

    switch (updatedField.fieldType) {
      case ActionTypes.shortText:
        el.setAttribute('data-default', updatedField.defaultValue ?? '');
        el.setAttribute(
          'data-placeholder',
          updatedField.placeholderText ?? 'placeholder'
        );
        el.setAttribute('data-min', updatedField.minRange?.toString() || '');
        el.setAttribute('data-max', updatedField.maxRange?.toString() || '');
        break;

      case ActionTypes.dropDownList:
      case ActionTypes.checkbox:
      case ActionTypes.radioGroup:
        el.setAttribute(
          'data-options',
          JSON.stringify(
            updatedField.options || [
              { key: 'Option 1', value: 'option_1' },
              { key: 'Option 2', value: 'option_2' },
            ]
          )
        );
        break;
      case ActionTypes.table:
        el.setAttribute(
          'data-columns',
          JSON.stringify(updatedField.columns || [])
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
    this.updateBuilderField(event.fieldId, updatedField.fieldType);

    switch (this.selectedFieldSettings?.fieldSize) {
      case 'small':
        this.resizeFieldWidth(event.fieldId, 9);
        break;
      case 'medium':
        this.resizeFieldWidth(event.fieldId, 18);
        break;
      case 'large':
        this.resizeFieldWidth(event.fieldId, 27);
        break;
      case 'full':
        this.resizeFieldWidth(event.fieldId, 36);
        break;
      default:
        break;
    }
  }

  updateBuilderField(fieldId: string, fieldType: string) {
    const fieldItem = document
      .getElementById(fieldId)
      ?.closest('.grid-stack-item') as HTMLElement;
    if (!fieldItem) return;

    const contentElement = fieldItem.querySelector(
      '.inner-grid-stack-item-content'
    ) as HTMLElement;
    if (!contentElement) return;

    switch (fieldType) {
      case ActionTypes.label: {
        const labelElement = contentElement.querySelector(
          'p[data-field-type="label"]'
        ) as HTMLParagraphElement;
        if (labelElement) {
          let dataLabel = labelElement.getAttribute('data-label')?.trim() || '';

          if (!dataLabel) {
            dataLabel = 'Label';
          }

          labelElement.textContent = dataLabel;
        }
        break;
      }

      case ActionTypes.shortText: {
        const inputElement = contentElement.querySelector(
          'input[data-field-type="shortText"]'
        ) as HTMLInputElement;

        const labelElement = contentElement.querySelector(
          'label.inner-grid-label'
        ) as HTMLLabelElement;

        if (inputElement) {
          let placeholder =
            inputElement.getAttribute('data-placeholder')?.trim() || '';
          if (!placeholder) {
            placeholder = 'Enter text';
          }
          inputElement.placeholder = placeholder;
        }

        if (labelElement && inputElement) {
          let labelText = inputElement.getAttribute('data-label')?.trim() || '';
          if (!labelText) {
            labelText = 'Text Field';
          }
          labelElement.textContent = labelText;
        }

        break;
      }

      case ActionTypes.dropDownList: {
        const selectElement = contentElement.querySelector(
          'select[data-field-type="dropDownList"]'
        ) as HTMLSelectElement;

        const labelElement = contentElement.querySelector(
          'label.inner-grid-label'
        ) as HTMLLabelElement;

        if (selectElement) {
          let labelText =
            selectElement.getAttribute('data-label')?.trim() || '';
          if (!labelText) {
            labelText = 'Dropdown';
          }
          if (labelElement) {
            labelElement.textContent = labelText;
          }

          const rawOptions =
            selectElement.getAttribute('data-options') ||
            JSON.stringify([
              { label: 'Option 1', value: 'option_1' },
              { label: 'Option 2', value: 'option_2' },
            ]);
          let options: { label: string; value: string }[] = [];

          try {
            options = JSON.parse(rawOptions);
            if (!Array.isArray(options)) throw new Error(); // force fallback if not array
          } catch {
            options = [
              { label: 'Option 1', value: 'option1' },
              { label: 'Option 2', value: 'option2' },
            ];
          }

          selectElement.innerHTML = '';

          options.forEach((option) => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            selectElement.appendChild(opt);
          });
        }

        break;
      }
      case ActionTypes.checkbox: {
        const checkboxGroup = contentElement.querySelector(
          'div[data-field-type="checkbox"]'
        ) as HTMLElement;

        if (!checkboxGroup) break;

        const groupLabelElement = checkboxGroup.querySelector(
          'p.inner-grid-label'
        ) as HTMLElement;
        let groupLabel = checkboxGroup.getAttribute('data-label')?.trim() || '';
        if (!groupLabel) {
          groupLabel = 'Select Options';
        }
        if (groupLabelElement) {
          groupLabelElement.textContent = groupLabel;
        }

        const rawOptions =
          checkboxGroup.getAttribute('data-options') ||
          JSON.stringify([
            { label: 'Option 1', value: 'option_1' },
            { label: 'Option 2', value: 'option_2' },
          ]);
        let options: { label: string; value: string }[] = [];

        try {
          options = JSON.parse(rawOptions);
          if (!Array.isArray(options)) throw new Error();
        } catch {
          options = [
            { label: 'Option A', value: '1' },
            { label: 'Option B', value: '2' },
          ];
        }

        const existingWrappers =
          checkboxGroup.querySelectorAll('.checkbox-wrapper');
        existingWrappers.forEach((wrapper) => wrapper.remove());

        options.forEach((option, index) => {
          const wrapper = document.createElement('div');
          wrapper.classList.add('checkbox-wrapper');

          const input = document.createElement('input');
          input.type = 'checkbox';
          input.id = `checkbox-${fieldId}-${index}`;
          input.classList.add('styled-checkbox');
          input.value = option.value;

          const label = document.createElement('label');
          label.setAttribute('for', input.id);
          label.classList.add('inner-grid-label');
          label.textContent = option.label;

          wrapper.appendChild(input);
          wrapper.appendChild(label);
          checkboxGroup.appendChild(wrapper);
        });

        break;
      }
      case ActionTypes.radioGroup: {
        const radioGroupWrapper = contentElement.querySelector(
          'div[data-field-type="radio"]'
        ) as HTMLElement;

        const groupLabelElement = contentElement.querySelector(
          'label.inner-grid-label'
        ) as HTMLLabelElement;

        if (!radioGroupWrapper) break;

        let groupLabel =
          radioGroupWrapper.getAttribute('data-label')?.trim() || '';
        if (!groupLabel) {
          groupLabel = 'Select an Option';
        }
        if (groupLabelElement) {
          groupLabelElement.textContent = groupLabel;
        }

        const rawOptions =
          radioGroupWrapper.getAttribute('data-options') ||
          JSON.stringify([
            { label: 'Option 1', value: 'option_1' },
            { label: 'Option 2', value: 'option_2' },
          ]);
        let options: { label: string; value: string }[] = [];

        try {
          options = JSON.parse(rawOptions);
          if (!Array.isArray(options)) throw new Error();
        } catch {
          options = [
            { label: 'Option 1', value: '1' },
            { label: 'Option 2', value: '2' },
          ];
        }

        const existingOptions =
          radioGroupWrapper.querySelectorAll('.radio-option');
        existingOptions.forEach((el) => el.remove());

        options.forEach((option, index) => {
          const radioId = `radio-${fieldId}-${index}`;

          const wrapper = document.createElement('div');
          wrapper.classList.add('radio-option');

          const input = document.createElement('input');
          input.type = 'radio';
          input.id = radioId;
          input.name = fieldId;
          input.classList.add('styled-radio');
          input.value = option.value;

          const label = document.createElement('label');
          label.setAttribute('for', radioId);
          label.textContent = option.label;

          wrapper.appendChild(input);
          wrapper.appendChild(label);
          radioGroupWrapper.appendChild(wrapper);
        });

        break;
      }

      default:
        break;
    }
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

  removeSection(sectionId: string) {
    const sectionItem = document
      .getElementById(sectionId)
      ?.closest('.grid-stack-item') as HTMLElement;
    if (!sectionItem) return;

    this.grid.removeWidget(sectionItem);
    this.repositionFooter();
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

  addSection() {
    this.itemCount++;

    const w = this.columnNum;
    const h = 8;

    const nodes = this.grid.engine.nodes;
    const lastYTest = nodes.reduce((max, node) => {
      const y = (node.y ?? 0) + (node.h ?? 0);
      return Math.max(max, y);
    }, 0);

    const lastY = nodes
      .filter((node) => node.id !== 'footer-grid')
      .reduce((max, node) => {
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
    item.setAttribute('gs-min-w', w.toString());
    item.setAttribute('gs-max-w', w.toString());
    item.setAttribute('gs-h', h.toString());
    item.setAttribute('id', innerGridId);
    item.setAttribute('gs-id', innerGridId);
    item.innerHTML = `<div class="close-section">
        <img src="/icons/delete.png" class="btn-close-section" alt="close" />
      </div>`;

    item.querySelector('.btn-close-section')?.addEventListener('click', () => {
      this.removeSection(innerGridId);
    });

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

    const sectionHeaderContentItem = document.createElement('div');
    sectionHeaderContentItem.classList.add('inner-grid-stack-item-content');
    sectionHeaderContentItem.innerHTML = `<label>Section</label>`;

    sectionHeader.appendChild(sectionHeaderContentItem);
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

    this.repositionFooter();
  }

  manageHeader() {
    if (this.isHeaderExist) {
      this.removeHeader();
      this.isHeaderExist = false;
    } else {
      this.addHeader();
      this.isHeaderExist = true;
    }
  }

  manageFooter() {
    if (this.isFooterExist) {
      this.removeFooter();
      this.isFooterExist = false;
    } else {
      this.addFooter();
      this.isFooterExist = true;
    }
  }

  addHeader() {
    const w = this.columnNum;
    const h = 8;

    const nodes = this.grid.engine.nodes;

    const innerGridId = `header-grid`;

    // Outer section item
    const item = document.createElement('div');
    item.classList.add('grid-stack-item');
    item.setAttribute('gs-x', '0');
    item.setAttribute('gs-y', '0');
    item.setAttribute('gs-w', w.toString());
    item.setAttribute('gs-h', h.toString());
    item.setAttribute('id', innerGridId);
    item.setAttribute('gs-id', innerGridId);

    item.setAttribute('gs-no-move', 'true');
    item.setAttribute('gs-no-resize', 'true');
    item.setAttribute('gs-locked', 'true');

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

    const sectionHeaderContentItem = document.createElement('div');
    sectionHeaderContentItem.classList.add('inner-grid-stack-item-content');
    sectionHeaderContentItem.innerHTML = `<label>Form Header</label>`;

    sectionHeader.appendChild(sectionHeaderContentItem);
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

  removeHeader() {
    this.removeSection('header-grid');
  }

  addFooter() {
    const w = this.columnNum;
    const h = 8;

    const nodes = this.grid.engine.nodes;
    const lastY = nodes.reduce((max, node) => {
      const y = (node.y ?? 0) + (node.h ?? 0);
      return Math.max(max, y);
    }, 0);

    const innerGridId = `footer-grid`;

    // Outer section item
    const item = document.createElement('div');
    item.classList.add('grid-stack-item');
    item.setAttribute('gs-x', '0');
    item.setAttribute('gs-y', lastY.toString());
    item.setAttribute('gs-w', w.toString());
    item.setAttribute('gs-h', h.toString());
    item.setAttribute('id', innerGridId);
    item.setAttribute('gs-id', innerGridId);

    item.setAttribute('gs-no-move', 'true');
    item.setAttribute('gs-no-resize', 'true');
    item.setAttribute('gs-locked', 'true');

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

    const sectionHeaderContentItem = document.createElement('div');
    sectionHeaderContentItem.classList.add('inner-grid-stack-item-content');
    sectionHeaderContentItem.innerHTML = `<label>Form Footer</label>`;

    sectionHeader.appendChild(sectionHeaderContentItem);
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

  removeFooter() {
    this.removeSection('footer-grid');
  }

  repositionFooter() {
    const footerEl = document.getElementById('footer-grid');
    if (!footerEl || !this.grid) return;

    const nodes = this.grid.engine.nodes.filter(
      (n) => n.el?.id !== 'footer-grid'
    );
    const newY = nodes.reduce((max, node) => {
      const y = (node.y ?? 0) + (node.h ?? 0);
      return Math.max(max, y);
    }, 0);

    // Update the Y of the footer
    this.grid.update(footerEl, {
      y: newY,
    });

    // Optional: Force container height update
    (this.grid as any)._updateContainerHeight?.();
  }

  emptyKeysDDL() {
    const ddlKeySelects = document.querySelectorAll(
      'select[id^="ddl-keys-dropdown"], select[id^="ddl-values-dropdown"], select[id^="ddl-preview-dropdown"]'
    ) as NodeListOf<HTMLSelectElement>;

    ddlKeySelects.forEach((select) => {
      select.innerHTML = '';
    });
  }

  emptyKeysTable() {
    this.tableKeys = [];
    this.tableURL = '';
  }
}
