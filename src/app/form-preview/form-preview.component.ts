import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import formSchma from '../../assets/form-schema.json';
@Component({
  selector: 'app-form-preview',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './form-preview.component.html',
  styleUrl: './form-preview.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FormPreviewComponent implements OnInit {
  form: FormGroup;
  schema: any;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    console.log('Form Schema:', formSchma);
    this.http.get('/form-schema.json').subscribe((data) => {
      this.schema = data;
      this.buildForm(this.schema.fields);
    });
  }

  buildForm(fields: any[]) {
    const controls: Record<string, any> = {};

    for (const field of fields) {
      const validators = field.required ? [Validators.required] : [];
      const defaultValue = field.type === 'checkbox' ? false : '';
      controls[field.name] = [defaultValue, validators];
    }

    this.form = this.fb.group(controls);
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form Value:', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
