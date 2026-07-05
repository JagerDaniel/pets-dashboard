/**
 * Apply all active filters to the full pet list.
 * All filters are AND logic — a pet must pass every active filter.
 */
export function applyFilters(pets, filters) {
  return pets.filter(pet => {

    // Status filter
    if (filters.status !== 'all') {
      if ((pet.findLost ?? '').toLowerCase() !== filters.status) return false;
    }

    // Animal type filter
    if (filters.animalType !== 'all') {
      if ((pet.catDog ?? '').toLowerCase() !== filters.animalType) return false;
    }

    // Date range filter
    if (filters.dateFrom && pet.occur) {
      if (pet.occur < filters.dateFrom) return false;
    }
    if (filters.dateTo && pet.occur) {
      // Include the full day of dateTo
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (pet.occur > endOfDay) return false;
    }

    // Color filter (any of the selected colors must appear in the pet's color list)
    if (filters.colors.length > 0) {
      const petColors = pet.allColors ?? [];
      const hasMatch = filters.colors.some(c => petColors.includes(c));
      if (!hasMatch) return false;
    }

    return true;
  });
}

/**
 * Count how many filter fields are non-default, for badges like "Filters · 2".
 */
export function countActiveFilters(filters) {
  let count = 0;
  if (filters.status !== 'all') count += 1;
  if (filters.animalType !== 'all') count += 1;
  if (filters.dateFrom !== null || filters.dateTo !== null) count += 1;
  if (filters.colors.length > 0) count += 1;
  return count;
}

export const DEFAULT_FILTERS = {
  status: 'all',       // 'all' | 'lost' | 'found'
  animalType: 'all',   // 'all' | 'dog' | 'cat'
  dateFrom: null,      // Date object or null
  dateTo: null,        // Date object or null
  colors: [],          // array of color keys e.g. ['black', 'brown']
};

export const COLOR_OPTIONS = [
  { value: 'black',  label: 'Black',        hex: '#2C2C2A' },
  { value: 'brown',  label: 'Brown',         hex: '#8B5E3C' },
  { value: 'gray',   label: 'Gray / Silver', hex: '#888780' },
  { value: 'yellow', label: 'Yellow / Gold', hex: '#EF9F27' },
  { value: 'white',  label: 'White / Cream', hex: '#C8C5B8' },
  { value: 'red',    label: 'Red',           hex: '#D85A30' },
  { value: 'other',  label: 'Other',         hex: '#7F77DD' },
];
