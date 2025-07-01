import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-settings-component',
  standalone: true,
  imports: [],
  templateUrl: './settings-component.component.html',
  styleUrl: './settings-component.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SettingsComponentComponent {
  @Input() fieldLabel: string = '';
}
