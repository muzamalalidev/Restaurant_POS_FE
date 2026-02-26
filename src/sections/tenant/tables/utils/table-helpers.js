// ----------------------------------------------------------------------

/**
 * Get availability label
 */
export const getAvailabilityLabel = (isAvailable) => isAvailable ? 'Available' : 'Unavailable';

// ----------------------------------------------------------------------

/**
 * Get availability color for badge
 * Returns MUI color variant based on availability status
 */
export const getAvailabilityColor = (isAvailable) => isAvailable ? 'success' : 'error';

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
 * Check if table can be edited
 * Only active tables can be edited
 */
export const canEdit = (isActive) => isActive === true;

// ----------------------------------------------------------------------

/**
 * Check if table can be deleted
 * Only active tables can be deleted
 */
export const canDelete = (isActive) => isActive === true;

// ----------------------------------------------------------------------

/**
 * Check if table can be released
 * Only unavailable tables can be released
 */
export const canRelease = (isAvailable) => isAvailable === false;

