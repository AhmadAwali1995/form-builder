import { Injectable } from '@angular/core';
import { fieldParameters } from '../shared/interfaces/field-parameters';
import { ActionTypes } from '../shared/enums/action-types';

@Injectable({
  providedIn: 'root',
})
export class FieldServicesService {
  constructor() {}

  fieldCreationGateway(parameters: fieldParameters, actionType: ActionTypes) {
    switch (actionType) {
      case ActionTypes.shortText:
        return this.createShortText(parameters);
      case ActionTypes.radioGroup:
        return this.createRadioGroup(parameters);
      case ActionTypes.checkbox:
        return this.createCheckBox(parameters);
      case ActionTypes.dropDownList:
        return this.createDropDown(parameters);
      case ActionTypes.table:
        return this.createTable(parameters);
      case ActionTypes.label:
        return this.createLabel(parameters);
    }
  }

  private createFieldContainer(parameters: fieldParameters): HTMLElement {
    const fieldItem = document.createElement('div');
    fieldItem.classList.add('grid-stack-item', 'field-grid-stack-item');
    fieldItem.setAttribute('gs-x', parameters.x.toString());
    fieldItem.setAttribute('gs-y', parameters.y.toString());
    fieldItem.setAttribute('gs-w', parameters.w.toString());
    fieldItem.setAttribute('gs-h', parameters.h?.toString() || '5');
    fieldItem.setAttribute('gs-min-w', '9');
    fieldItem.setAttribute('gs-min-h', parameters.h?.toString() || '5');

    const id = `field-${this.guid()}`;
    fieldItem.setAttribute('id', id);
    fieldItem.setAttribute('gs-id', id);
    return fieldItem;
  }

  createLabel(parameters: fieldParameters) {
    const ddlId = `label-${this.guid()}`;
    const fieldItem = this.createFieldContainer(parameters);
    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');
    fieldContentItem.innerHTML = `
    <p id="${ddlId}" data-field-type="${ActionTypes.label}" class="inner-grid-form-label">Text Field</p>`;

    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }

  createShortText(parameters: fieldParameters) {
    const ddlId = `shorttext-${this.guid()}`;
    const fieldItem = this.createFieldContainer(parameters);

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');
    fieldContentItem.innerHTML = `
      <label class="inner-grid-label" for="${ddlId}">Text Field</label>
      <input id="${ddlId}" data-field-type="${ActionTypes.shortText}" type="text" placeholder="Text Field" class="inner-grid-textbox" >
    `;

    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }

  createDropDown(parameters: fieldParameters) {
    const ddlId = `dropdown-${this.guid()}`;
    const fieldItem = this.createFieldContainer(parameters);
    // const fieldOptionsBox = this.createFieldOptionsBox();

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');
    fieldContentItem.innerHTML =
      `
      <label class="inner-grid-label" for="${ddlId}">Dropdown</label>
      <select data-field-type="` +
      ActionTypes.dropDownList +
      `" id="${ddlId}" class="inner-grid-textbox">
        <option value="test1">test1</option>
        <option value="test2">test2</option>
        <option value="test3">test3</option>
      </select>
    `;

    // fieldContentItem.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }

  createRadioGroup(parameters: fieldParameters) {
    const ddlId = `radiogroup-${this.guid()}`;
    const fieldItem = this.createFieldContainer(parameters);

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');

    const radioGroupName = `radio-group-${parameters.count}`;
    fieldContentItem.innerHTML = `
      <label for="${ddlId}" class="inner-grid-label">Select an Option</label>
      <div id="${ddlId}" data-field-type="${
      ActionTypes.radioGroup
    }" class="radio-group-wrapper">
        ${['Option 1', 'Option 2', 'Option 3']
          .map(
            (label, i) => `
          <div class="radio-option">
            <input type="radio" id="${radioGroupName}-${
              i + 1
            }" name="${radioGroupName}" class="styled-radio" value="${i + 1}" />
            <label for="${radioGroupName}-${i + 1}">${label}</label>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    // fieldContentItem.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }

  createCheckBox(parameters: fieldParameters) {
    const ddlId = `checkbox-${this.guid()}`;
    const fieldItem = this.createFieldContainer(parameters);

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');

    const staticOptions = ['Option A', 'Option B', 'Option C'];

    const checkboxGroup = document.createElement('div');
    checkboxGroup.classList.add('checkbox-group-wrapper');
    checkboxGroup.setAttribute(
      'data-field-type',
      ActionTypes.checkbox.toString()
    );
    checkboxGroup.setAttribute('id', ddlId);
    checkboxGroup.innerHTML = `<p class="inner-grid-label">Select Options</p>`;

    staticOptions.forEach((label, index) => {
      const checkboxId = `checkbox-${parameters.count}-${index}`;
      const wrapper = document.createElement('div');
      wrapper.classList.add('checkbox-wrapper');
      wrapper.innerHTML = `
        <input type="checkbox" id="${checkboxId}" class="styled-checkbox" value="${
        index + 1
      }" />
        <label for="${checkboxId}" class="inner-grid-label">${label}</label>
      `;
      checkboxGroup.appendChild(wrapper);
    });

    fieldContentItem.appendChild(checkboxGroup);
    // fieldContentItem.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }

  createTable(parameters: fieldParameters) {
    const tableId = `table-${this.guid()}`;
    const fieldItem = this.createFieldContainer(parameters);

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');

    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('table-wrapper');

    const table = document.createElement('table');
    table.id = tableId;
    table.classList.add('custom-table');
    table.setAttribute('data-field-type', ActionTypes.table.toString());

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Column A</th>
        <th>Column B</th>
        <th>Column C</th>
      </tr>`;

    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrapper.appendChild(table);

    const totalData = Array.from({ length: 1 }, (_, i) => ({
      a: `---`,
      b: `---`,
      c: `---`,
    }));

    const rowsPerPage = 5;
    let currentPage = 1;

    function renderTablePage(page: number) {
      tbody.innerHTML = ''; // Clear existing rows
      const start = (page - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      const pageData = totalData.slice(start, end);

      pageData.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${row.a}</td>
        <td>${row.b}</td>
        <td>${row.c}</td>
      `;
        tbody.appendChild(tr);
      });
    }

    // Create pagination controls
    const pagination = document.createElement('div');
    pagination.classList.add('pagination');

    function renderPagination() {
      pagination.innerHTML = '';
      const totalPages = Math.ceil(totalData.length / rowsPerPage);

      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i.toString();
        btn.className = i === currentPage ? 'active' : '';
        btn.addEventListener('click', () => {
          currentPage = i;
          renderTablePage(currentPage);
          renderPagination();
        });
        pagination.appendChild(btn);
      }
    }

    renderTablePage(currentPage);
    renderPagination();

    fieldContentItem.appendChild(tableWrapper);
    fieldContentItem.appendChild(pagination);
    // fieldContentItem.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }

  guid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
