// ----------------------------------------------------------------------

/**
 * Get active status label
 */
export const getActiveStatusLabel = (isActive) => isActive ? 'Active' : 'Inactive';

// ----------------------------------------------------------------------

/**
 * Get active status color for badge
 * Returns MUI color variant based on active status
 */
export const getActiveStatusColor = (isActive) => isActive ? 'success' : 'default';

// ----------------------------------------------------------------------

/**
 * Format time in minutes to readable string
 * Formats decimal to "X min" or "X.XX min" if decimal part exists
 */
export const formatTimeMinutes = (minutes) => {
  if (minutes == null || minutes === undefined) return '0 min';
  
  const numMinutes = Number(minutes);
  if (isNaN(numMinutes)) return '0 min';
  
  // If it's a whole number, show without decimal
  if (numMinutes % 1 === 0) {
    return `${numMinutes} min`;
  }
  
  // Otherwise, show with 2 decimal places
  return `${numMinutes.toFixed(2)} min`;
};

// ----------------------------------------------------------------------

/**
 * Check if recipe can be edited
 * Only active recipes can be edited
 */
export const canEdit = (isActive) => isActive === true;

// ----------------------------------------------------------------------

/**
 * Check if recipe can be deleted
 * Only active recipes can be deleted
 */
export const canDelete = (isActive) => isActive === true;

// ----------------------------------------------------------------------

/**
 * Check if recipe active status can be toggled
 * Always allowed
 */
export const canToggleActive = (isActive) => true;

