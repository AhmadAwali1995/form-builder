import { Injectable } from '@angular/core';

export interface fieldParameters {
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
}

export enum ActionTypes {
  shortText,
  dropDownList,
  checkbox,
  radioGroup,
}

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
    }
  }

  private createFieldContainer(parameters: fieldParameters): HTMLElement {
    const fieldItem = document.createElement('div');
    fieldItem.classList.add('grid-stack-item', 'field-grid-stack-item');
    fieldItem.setAttribute('gs-x', parameters.x.toString());
    fieldItem.setAttribute('gs-y', parameters.y.toString());
    fieldItem.setAttribute('gs-w', parameters.w.toString());
    fieldItem.setAttribute('gs-h', parameters.h?.toString() || '5');
    return fieldItem;
  }

  private createFieldOptionsBox(): HTMLElement {
    const box = document.createElement('div');
    box.classList.add('field-options-box', 'data-gs-cancel');
    box.innerHTML = `<p>X</p>`.repeat(5);
    return box;
  }

  createShortText(parameters: fieldParameters) {
    const fieldItem = this.createFieldContainer(parameters);
    const fieldOptionsBox = this.createFieldOptionsBox();

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');
    fieldContentItem.innerHTML = `
      <label class="inner-grid-label" for="text${parameters.count}">Text Field</label>
      <input id="text${parameters.count}" type="text" placeholder="Text Field" class="inner-grid-textbox" >
    `;

    fieldContentItem.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }

  createDropDown(parameters: fieldParameters) {
    const fieldItem = this.createFieldContainer(parameters);
    const fieldOptionsBox = this.createFieldOptionsBox();

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');
    fieldContentItem.innerHTML = `
      <label class="inner-grid-label" for="dropdown${parameters.count}">Dropdown</label>
      <select id="dropdown${parameters.count}" class="inner-grid-textbox">
        <option value="test1">test1</option>
        <option value="test2">test2</option>
        <option value="test3">test3</option>
      </select>
    `;

    fieldContentItem.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }

  createRadioGroup(parameters: fieldParameters) {
    const fieldItem = this.createFieldContainer(parameters);
    const fieldOptionsBox = this.createFieldOptionsBox();

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');

    const radioGroupName = `radio-group-${parameters.count}`;
    fieldContentItem.innerHTML = `
      <label class="inner-grid-label">Select an Option</label>
      <div class="radio-group-wrapper">
        ${['Option 1', 'Option 2', 'Option 3']
          .map(
            (label, i) => `
          <div class="radio-option">
            <input type="radio" id="${radioGroupName}-${
              i + 1
            }" name="${radioGroupName}" class="styled-radio" />
            <label for="${radioGroupName}-${i + 1}">${label}</label>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    fieldContentItem.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }

  createCheckBox(parameters: fieldParameters) {
    const fieldItem = this.createFieldContainer(parameters);
    const fieldOptionsBox = this.createFieldOptionsBox();

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');

    const staticOptions = ['Option A', 'Option B', 'Option C'];

    const checkboxGroup = document.createElement('div');
    checkboxGroup.classList.add('checkbox-group-wrapper');
    checkboxGroup.innerHTML = `<p class="inner-grid-label">Select Options</p>`;

    staticOptions.forEach((label, index) => {
      const checkboxId = `checkbox-${parameters.count}-${index}`;
      const wrapper = document.createElement('div');
      wrapper.classList.add('checkbox-wrapper');
      wrapper.innerHTML = `
        <input type="checkbox" id="${checkboxId}" class="styled-checkbox" />
        <label for="${checkboxId}" class="inner-grid-label">${label}</label>
      `;
      checkboxGroup.appendChild(wrapper);
    });

    fieldContentItem.appendChild(checkboxGroup);
    fieldContentItem.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }
}
