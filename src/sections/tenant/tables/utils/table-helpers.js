// ----------------------------------------------------------------------

/**
 * Get availability label
 */
export const getAvailabilityLabel = (isAvailable) => {
  return isAvailable ? 'Available' : 'Unavailable';
};

// ----------------------------------------------------------------------

/**
 * Get availability color for badge
 * Returns MUI color variant based on availability status
 */
export const getAvailabilityColor = (isAvailable) => {
  return isAvailable ? 'success' : 'error';
};

// ----------------------------------------------------------------------

/**
 * Get active status label
 */
export const getActiveStatusLabel = (isActive) => {
  return isActive ? 'Active' : 'Inactive';
};

// ----------------------------------------------------------------------

/**
 * Get active status color for badge
 * Returns MUI color variant based on active status
 */
export const getActiveStatusColor = (isActive) => {
  return isActive ? 'success' : 'default';
};

// ----------------------------------------------------------------------

/**
 * Check if table can be edited
 * Only active tables can be edited
 */
export const canEdit = (isActive) => {
  return isActive === true;
};

// ----------------------------------------------------------------------

/**
 * Check if table can be deleted
 * Only active tables can be deleted
 */
export const canDelete = (isActive) => {
  return isActive === true;
};

// ----------------------------------------------------------------------

/**
 * Check if table can be released
 * Only unavailable tables can be released
 */
export const canRelease = (isAvailable) => {
  return isAvailable === false;
};

