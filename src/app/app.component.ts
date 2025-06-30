import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormBuilderComponent } from "./form-builder/form-builder.component";
import { FormPreviewComponent } from "./form-preview/form-preview.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormBuilderComponent, RouterOutlet, FormPreviewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'form-builder';
}
