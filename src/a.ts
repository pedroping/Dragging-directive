import { FormGroup, FormControl } from "@angular/forms";

interface Profile {
  firstName: string;
  lastName: string;
  address: {
    street: string;
    city: string
  }
}

export interface A {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  address: FormGroup<{
    street: FormControl<string>;
    city: FormControl<string>
  }>
}

const profileForm = new FormGroup<ControlsOf<Profile>>({
  firstName: new FormControl('', { nonNullable: true }),
  lastName: new FormControl('', { nonNullable: true }),
  address: new FormGroup({
    street: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true })
  })
});

export type ControlsOf<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends { [key: string]: any }
  ? FormGroup<ControlsOf<T[K]>>
  : FormControl<T[K]>;
};