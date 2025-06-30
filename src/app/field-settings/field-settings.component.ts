import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-field-settings',
  standalone: true,
  imports: [],
  templateUrl: './field-settings.component.html',
  styleUrl: './field-settings.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FieldSettingsComponent {
  @Input() fieldId: string = '';
  @Input() fieldType: string = '';
  @Input() fieldLabel: string = '';
  @Input() fieldSize: string = '';
  @Input() options?: string[] = [];
  @Input() fieldPlaceholder?: string = '';
  @Input() fieldDefultValue?: string = '';
  @Input() fieldMinValue?: number = 0;
  @Input() fieldMaxValue?: number = 0;
  @Input() isfieldRequired: boolean = false;
}
