/**
 * Maps normalized backend field errors into Ant Design Form field data.
 *
 * The mapper supports dotted and indexed paths and allows explicit path
 * overrides when a DTO field name differs from its form field name.
 */
export type FormFieldName =
  | string
  | number
  | readonly (string | number)[];

export interface MappedFormFieldError {
  name: FormFieldName;
  errors: string[];
}

export interface FieldErrorFormTarget {
  setFields: (fields: MappedFormFieldError[]) => void;
  scrollToField: (
    name: FormFieldName,
    options?: ScrollIntoViewOptions & { focus?: boolean },
  ) => void;
}

export type BackendFieldErrorMap = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

export type FormFieldNameMap = Readonly<Record<string, FormFieldName>>;

const indexedPathPattern = /([^[.\]]+)|\[([^\]]+)\]/g;

const normalizeBracketToken = (token: string): string | number => {
  const unquoted = token.replace(/^(['"])(.*)\1$/, "$2");
  return /^\d+$/.test(unquoted) ? Number(unquoted) : unquoted;
};

export function parseBackendFieldPath(field: string): FormFieldName {
  const path: Array<string | number> = [];

  for (const match of field.matchAll(indexedPathPattern)) {
    const directToken = match[1];
    const bracketToken = match[2];

    if (directToken) {
      path.push(directToken);
    } else if (bracketToken) {
      path.push(normalizeBracketToken(bracketToken));
    }
  }

  return path.length > 1 ? path : (path[0] ?? field);
}

export function mapBackendFieldErrors(
  fieldErrors: BackendFieldErrorMap,
  fieldNameMap: FormFieldNameMap = {},
): MappedFormFieldError[] {
  return Object.entries(fieldErrors).flatMap(([field, messages]) => {
    const normalizedMessages =
      typeof messages === "string" ? [messages] : [...(messages ?? [])];

    if (normalizedMessages.length === 0) {
      return [];
    }

    return [
      {
        name: fieldNameMap[field] ?? parseBackendFieldPath(field),
        errors: normalizedMessages,
      },
    ];
  });
}

export function focusFirstFormError(
  form: FieldErrorFormTarget,
  fields: readonly MappedFormFieldError[],
): boolean {
  const firstField = fields[0];
  if (!firstField) {
    return false;
  }

  form.scrollToField(firstField.name, {
    block: "center",
    focus: true,
  });
  return true;
}

export function applyBackendFieldErrors(
  form: FieldErrorFormTarget,
  fieldErrors: BackendFieldErrorMap,
  fieldNameMap: FormFieldNameMap = {},
): boolean {
  const fields = mapBackendFieldErrors(fieldErrors, fieldNameMap);
  if (fields.length === 0) {
    return false;
  }

  form.setFields(fields);
  return focusFirstFormError(form, fields);
}
