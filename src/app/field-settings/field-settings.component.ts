import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-field-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './field-settings.component.html',
  styleUrl: './field-settings.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FieldSettingsComponent {
  @Input() fieldId: string = '';
  @Input() fieldType: string = 'text';
  @Input() fieldLabel: string = '';
  @Input() fieldSize: string = 'small';
  @Input() fieldPlaceholder: string = '';
  @Input() fieldDefultValue: string = '';
  @Input() fieldMinValue: number = 0;
  @Input() fieldMaxValue: number = 0;
  @Input() isfieldRequired: boolean = false;

  @Output() fieldUpdated = new EventEmitter<any>();

  emitChange() {
    this.fieldUpdated.emit({
      fieldId: this.fieldId,
      fieldType: this.fieldType,
      fieldLabel: this.fieldLabel,
      fieldSize: this.fieldSize,
      fieldPlaceholder: this.fieldPlaceholder,
      fieldDefultValue: this.fieldDefultValue,
      fieldMinValue: this.fieldMinValue,
      fieldMaxValue: this.fieldMaxValue,
      isfieldRequired: this.isfieldRequired,
    });
  }
}
