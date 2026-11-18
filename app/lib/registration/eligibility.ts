export const adultDeclaration = 'adult-v1';
export const legacyDeclarationEnd = Date.parse('2026-12-03T00:00:00Z');
export function acceptsAdultDeclaration(value: string | null, now = Date.now()) {
  return value === adultDeclaration || value === 'adult-drc-v1' && now < legacyDeclarationEnd;
}
