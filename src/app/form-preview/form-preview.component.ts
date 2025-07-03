import { ActionTypes } from './../shared/enums/action-types';
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
  actionTypes = ActionTypes;
  form: FormGroup;
  sections: { id: string; fields: { id: string; json: FieldSettings }[] }[] =
    [];
  currentSectionIndex = 0;
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    const raw = localStorage.getItem('form-sections');
    if (raw) {
      this.sections = JSON.parse(raw);
      const allFields = this.sections.flatMap((s) =>
        s.fields.map((f) => f.json)
      );
      this.buildForm(allFields);
    }
  }

  buildForm(fields: FieldSettings[]) {
    const controls: Record<string, any> = {};

    for (const field of fields) {
      const validators = [];

      if (field.isRequired) {
        validators.push(Validators.required);
      }

      if (field.fieldType === ActionTypes.shortText) {
        if (typeof field.minRange === 'number' && field.minRange !== 0) {
          validators.push(Validators.minLength(field.minRange));
        }

        if (typeof field.maxRange === 'number' && field.maxRange !== 0) {
          validators.push(Validators.maxLength(field.maxRange));
        }

        if (field.fieldName?.toLowerCase() === 'email') {
          validators.push(Validators.email);
        }
      }

      const defaultValue =
        field.defaultValue ??
        (field.fieldType === ActionTypes.checkbox ? false : '');

      controls[field.fieldName] = [defaultValue, validators];
    }

    this.form = this.fb.group(controls);
  }

  nextSection() {
    if (this.currentSectionIndex < this.sections.length - 1) {
      this.currentSectionIndex++;
    }
  }

  prevSection() {
    if (this.currentSectionIndex > 0) {
      this.currentSectionIndex--;
    }
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('✅ Form Submitted:', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
