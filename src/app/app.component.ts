import { Component } from '@angular/core';
import { FormBuilderComponent } from "./form-builder/form-builder.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormBuilderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'form-builder';
}
