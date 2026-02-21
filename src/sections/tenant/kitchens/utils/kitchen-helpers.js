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
 * Check if kitchen can be edited
 * Only active kitchens can be edited
 */
export const canEdit = (isActive) => {
  return isActive === true;
};

// ----------------------------------------------------------------------

/**
 * Check if kitchen can be deleted
 * Only active kitchens can be deleted
 */
export const canDelete = (isActive) => {
  return isActive === true;
};

// ----------------------------------------------------------------------

/**
 * Check if kitchen active status can be toggled.
 * P2-003: Toggle is shown for all rows; API allows toggle for any non-deleted kitchen (argument unused).
 */
export const canToggleActive = () => {
  return true;
};

