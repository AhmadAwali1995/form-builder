import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActionTypes } from './../shared/enums/action-types';
import { FieldSettings, Sections } from '../shared/interfaces/sections';

@Component({
  selector: 'app-form-preview',
  standalone: true,
  imports: [RouterModule, CommonModule, ReactiveFormsModule],
  templateUrl: './form-preview.component.html',
  styleUrls: ['./form-preview.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FormPreviewComponent implements OnInit {
  actionTypes = ActionTypes;
  form: FormGroup;
  sections: Sections[] = [];
  currentSectionIndex = 0;

  currentPageMap: Record<string, number> = {};
  pageSize = 5;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    const raw = localStorage.getItem('form-sections');
    if (raw) {
      this.sections = JSON.parse(raw);
      const allFields = this.sections.flatMap((s) =>
        s.fields.map((f) => f.fieldSettings)
      );

      for (const field of allFields) {
        if (field.fieldType === ActionTypes.table && field.columns) {
          this.currentPageMap[field.fieldId] = 1;
        }
      }

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

  getPaginatedData(fieldId: string): any[] {
    const columnSet = this.getTableColumnSet(fieldId);
    if (!columnSet) return [];

    const data = columnSet.columnsData ?? [];
    const currentPage = this.currentPageMap[fieldId] ?? 1;
    const start = (currentPage - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  }

  getTableColumnSet(fieldId: string) {
    const field = this.sections
      .flatMap((s) => s.fields)
      .find((f) => f.fieldSettings.fieldId === fieldId);
    return field?.fieldSettings.columns?.[0]; // assumes first column set
  }

  getTotalPages(fieldId: string): number {
    const columnSet = this.getTableColumnSet(fieldId);
    const data = columnSet?.columnsData ?? [];
    return Math.ceil(data.length / this.pageSize);
  }

  setPage(fieldId: string, pageNumber: number): void {
    this.currentPageMap[fieldId] = pageNumber;
  }

  prevPage(fieldId: string): void {
    if (this.currentPageMap[fieldId] > 1) {
      this.currentPageMap[fieldId]--;
    }
  }

  nextPage(fieldId: string): void {
    if (this.currentPageMap[fieldId] < this.getTotalPages(fieldId)) {
      this.currentPageMap[fieldId]++;
    }
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
    console.log(this.sections);

    if (this.form.valid) {
      console.log('✅ Form Submitted:', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
