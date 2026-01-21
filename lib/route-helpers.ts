export function buildSearchString(
  params?: Record<string, string | string[] | undefined>,
) {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'undefined') return;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, item));
    } else {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function isEditMode(searchParams?: { edit?: string | string[] }) {
  const editParam = searchParams?.edit;
  if (Array.isArray(editParam)) {
    return editParam.includes('1') || editParam.includes('true');
  }
  return editParam === '1' || editParam === 'true';
}
