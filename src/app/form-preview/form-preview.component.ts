import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FieldSettings } from '../shared/interfaces/field-settings';
@Component({
  selector: 'app-form-preview',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './form-preview.component.html',
  styleUrl: './form-preview.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class FormPreviewComponent implements OnInit {
  form: FormGroup;
  schema: any;
  sections: { id: string; fields: { id: string; json: FieldSettings }[] }[] =
    [];
  currentSectionIndex = 0;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  async ngOnInit(): Promise<void> {
    const raw = localStorage.getItem('form-sections');
    if (raw) {
      this.sections = JSON.parse(raw);
      const allFields = this.sections.flatMap((s) =>
        s.fields.map((f) => f.json)
      );

      await this.buildForm(allFields);
    }

    // const navigation = window.history.state;
    // this.sections = navigation.sections || [];
    // console.log(this.sections);
    // this.http.get('/form-schema.json').subscribe((data) => {
    //   this.schema = data;
    //   this.buildForm(this.schema.fields);
    // });
  }

  async buildForm(fields: any[]) {
    const controls: Record<string, any> = {};

    for (const field of fields) {
      const validators = [];

      if (field.required) {
        validators.push(Validators.required);
      }

      // TEXT field character length validators
      if (field.type === 'text') {
        if (typeof field.minValue === 'number' && field.minValue > 0) {
          validators.push(Validators.minLength(field.minValue));
        }

        if (typeof field.maxValue === 'number' && field.maxValue > 0) {
          validators.push(Validators.maxLength(field.maxValue));
        }

        if (field.name === 'email') {
          validators.push(Validators.email);
        }
      }

      const defaultValue =
        field.defaultValue ?? (field.type === 'checkbox' ? false : '');

      controls[field.name] = [defaultValue, validators];
    }

    this.form = this.fb.group(controls);
  }

  nextSection(): void {
    if (this.currentSectionIndex < this.sections.length - 1) {
      this.currentSectionIndex++;
    }
  }

  prevSection(): void {
    if (this.currentSectionIndex > 0) {
      this.currentSectionIndex--;
    }
  }

  onSubmit() {
    console.log('Form sections', this.sections);
    if (this.form.valid) {
      console.log('Form Value:', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
