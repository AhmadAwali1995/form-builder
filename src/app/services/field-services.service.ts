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
        break;
      case ActionTypes.radioGroup:
        return this.createShortText(parameters);
        break;
      case ActionTypes.checkbox:
        return this.createShortText(parameters);
        break;
      case ActionTypes.dropDownList:
        return this.createDropDown(parameters);
        break;
    }
  }

  createShortText(parameters: fieldParameters) {
    const fieldItem = document.createElement('div');
    fieldItem.classList.add('grid-stack-item', 'field-grid-stack-item');
    fieldItem.setAttribute('gs-x', parameters.x.toString());
    fieldItem.setAttribute('gs-y', parameters.y.toString());
    fieldItem.setAttribute('gs-w', parameters.w.toString());
    fieldItem.setAttribute('gs-h', '5');

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
    const fieldItem = document.createElement('div');
    fieldItem.classList.add('grid-stack-item', 'field-grid-stack-item');
    fieldItem.setAttribute('gs-x', parameters.x.toString());
    fieldItem.setAttribute('gs-y', parameters.y.toString());
    fieldItem.setAttribute('gs-w', parameters.w.toString());
    fieldItem.setAttribute('gs-h', '5');

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

    const fieldContentItem = document.createElement('div');
    fieldContentItem.classList.add('inner-grid-stack-item-content');
    fieldContentItem.innerHTML = `
      <label class="inner-grid-label" for="text${parameters.count}">Text Field</label>
      <select id="text${parameters.count}" class="inner-grid-textbox">
    <option value="test1">test1</option>
    <option value="test2">test2</option>
    <option value="test3">test3</option>
</select>
`;
// <input id="text${parameters.count}" type="text" placeholder="Text Field" class="inner-grid-textbox" >

    fieldContentItem.appendChild(fieldOptionsBox);
    fieldItem.appendChild(fieldContentItem);

    return fieldItem;
  }
}
