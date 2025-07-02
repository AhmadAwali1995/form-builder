import { ActionTypes } from './../shared/enums/action-types';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FieldSettings } from '../shared/interfaces/field-settings';

@Component({
  selector: 'app-settings-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-component.component.html',
  styleUrls: ['./settings-component.component.scss'],
})
export class SettingsComponentComponent implements OnInit {
  @Input() fieldSettings: any;
  @Input() fieldId!: string;
  @Input() fieldType!: string;
  @Output() fieldUpdated = new EventEmitter<any>();
  options: { label: string; value: string }[] = [];

  actionTypes = ActionTypes;

  fieldLabel?: string;
  fieldSize = 'medium';
  placeholderText?: string;
  defaultValue?: string;
  minRange?: number;
  maxRange?: number;
  cssClass?: string;
  isRequired = false;
  dropdownOptions = '';
  showOptionsModal = false;

  ngOnInit(): void {
    // Here you can load existing settings if needed
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fieldSettings'] && this.fieldSettings) {
      this.loadSettingsFromField(this.fieldSettings);
    }
  }
  openOptionsModal() {
    this.showOptionsModal = true;
  }

  closeOptionsModal() {
    this.showOptionsModal = false;
  }

  addOption() {
    this.options.push({ label: '', value: '' });
  }

  removeOption(index: number) {
    this.options.splice(index, 1);
  }

  saveOptions() {
    this.emitUpdate();
    this.closeOptionsModal();
  }

  loadSettingsFromField(settings: FieldSettings) {
    this.fieldLabel = settings.fieldLabel || '';
    this.fieldSize = settings.fieldSize || 'medium';
    this.cssClass = settings.cssClass || '';
    this.isRequired = settings.isRequired || false;

    switch (settings.fieldType) {
      case ActionTypes.shortText:
        this.defaultValue = settings.defaultValue || '';
        this.placeholderText = settings.placeholderText || '';
        this.minRange = settings.minRange ?? 0;
        this.maxRange = settings.maxRange ?? 0;
        break;

      case ActionTypes.dropDownList:
      case ActionTypes.checkbox:
      case ActionTypes.radioGroup:
        this.options = settings.options || [];
        break;

      default:
        this.placeholderText = '';
        this.minRange = undefined;
        this.maxRange = undefined;
        this.options = [];
        break;
    }
  }

  emitUpdate() {
    const baseUpdate = {
      fieldId: this.fieldId,
      fieldLabel: this.fieldLabel,
      fieldType: this.fieldType,
      fieldSize: this.fieldSize,
      cssClass: this.cssClass,
      isRequired: this.isRequired,
    };

    switch (this.fieldType) {
      case ActionTypes.shortText:
        this.fieldUpdated.emit({
          ...baseUpdate,
          defaultValue: this.defaultValue,
          placeholderText: this.placeholderText,
          minRange: this.minRange,
          maxRange: this.maxRange,
        });
        break;

      case ActionTypes.dropDownList:
      case ActionTypes.checkbox:
      case ActionTypes.radioGroup:
        this.fieldUpdated.emit({
          ...baseUpdate,
          options: this.options,
        });
        break;

      default:
        this.fieldUpdated.emit({
          ...baseUpdate,
          placeholderText: '',
          minRange: 0,
          maxRange: 0,
          options: [],
        });
        break;
    }
  }

  parseDropdownOptions(): string[] {
    if (this.fieldType !== 'dropdown') return [];
    return this.dropdownOptions
      .split('\n')
      .map((opt) => opt.trim())
      .filter((opt) => opt);
  }
}
