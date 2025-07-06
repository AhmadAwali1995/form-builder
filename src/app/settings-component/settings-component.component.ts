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
import { FieldSettings } from '../shared/interfaces/sections';

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
  fieldName?: string;
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
    this.options = this.options.filter(
      (opt) => opt.label?.trim() && opt.value?.trim()
    );
    this.showOptionsModal = false;
  }

  addOption() {
    this.options.push({ label: '', value: '' });
  }

  removeOption(index: number) {
    this.options.splice(index, 1);
  }

  saveOptions() {
    // Filter out options where label or value is empty (trimmed)
    this.options = this.options.filter(
      (opt) => opt.label?.trim() && opt.value?.trim()
    );
    this.emitUpdate();
    this.closeOptionsModal();
  }

  onSubmit() {
    // This will only fire if form is valid
    this.emitUpdate();
  }

  loadSettingsFromField(settings: FieldSettings) {
    this.fieldLabel = settings.fieldLabel ?? this.fieldLabel ?? '';
    this.fieldName = settings.fieldName ?? this.fieldName ?? '';
    this.fieldSize = settings.fieldSize ?? this.fieldSize ?? 'medium';
    this.cssClass = settings.cssClass ?? this.cssClass ?? '';
    this.isRequired = settings.isRequired ?? this.isRequired ?? false;

    if (settings.fieldType === ActionTypes.label) {
      this.fieldSize = 'full';
    }

    switch (settings.fieldType) {
      case ActionTypes.shortText:
        this.defaultValue = settings.defaultValue ?? this.defaultValue ?? '';
        this.placeholderText =
          settings.placeholderText ?? this.placeholderText ?? '';
        this.minRange = settings.minRange ?? this.minRange;
        this.maxRange = settings.maxRange ?? this.maxRange;
        break;

      case ActionTypes.dropDownList:
      case ActionTypes.checkbox:
      case ActionTypes.radioGroup:
        this.options = [...(settings.options ?? this.options)];
        break;
    }
  }

  emitUpdate() {
    const baseUpdate: FieldSettings = {
      fieldId: this.fieldId,
      fieldName: this.fieldName || '',
      fieldType: this.fieldType as ActionTypes,
      fieldLabel: this.fieldLabel || this.fieldSettings?.fieldLabel || '',
      fieldSize: this.fieldSize || this.fieldSettings?.fieldSize || 'medium',
      cssClass: this.cssClass || this.fieldSettings?.cssClass || '',
      isRequired: this.isRequired ?? this.fieldSettings?.isRequired ?? false,
    };

    switch (this.fieldType) {
      case ActionTypes.shortText:
        this.fieldUpdated.emit({
          ...baseUpdate,
          defaultValue:
            this.defaultValue ?? this.fieldSettings?.defaultValue ?? '',
          placeholderText:
            this.placeholderText ?? this.fieldSettings?.placeholderText ?? '',
          minRange: this.minRange ?? this.fieldSettings?.minRange,
          maxRange: this.maxRange ?? this.fieldSettings?.maxRange,
        });
        break;

      case ActionTypes.dropDownList:
      case ActionTypes.checkbox:
      case ActionTypes.radioGroup:
        this.fieldUpdated.emit({
          ...baseUpdate,
          options: this.options.length
            ? this.options
            : this.fieldSettings?.options ?? [],
        });
        break;

      case ActionTypes.table:
        this.fieldUpdated.emit({
          ...baseUpdate,
          columns: this.fieldSettings?.columns ?? [],
        });
        break;

      default:
        this.fieldUpdated.emit(baseUpdate);
        break;
    }

    if (this.minRange! > this.maxRange!) {
      setTimeout(() => {
        this.minRange = this.maxRange;
      });
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
