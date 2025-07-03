
export interface Sections{
    sectionId:string,
    fields:Fields[]
}

export interface Fields{
    fieldId:string,
    fieldSettings:FieldSettings
}

export interface FieldSettings {
  fieldId: string;
  fieldType: string;
  fieldLabel?: string;
  fieldName: string;
  fieldSize: 'small' | 'medium' | 'large' | 'full';
  sifieldSizeze?: string;
  placeholderText?: string;
  defaultValue?: string;
  minRange?: number;
  maxRange?: number;
  cssClass?: string;
  isRequired?: boolean;
  direction?: 'horizontal' | 'vertical';
  options?: { label: string; value: string }[];
}