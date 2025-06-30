import { Routes } from '@angular/router';
import { FormBuilderComponent } from './form-builder/form-builder.component';
import { FormPreviewComponent } from './form-preview/form-preview.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'builder'},
  { path: 'builder', component: FormBuilderComponent },
  { path: 'preview', component: FormPreviewComponent },
  { path: '**', redirectTo: 'builder' }
];
