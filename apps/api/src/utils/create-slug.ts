export function createSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}
