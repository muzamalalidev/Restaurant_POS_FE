// ----------------------------------------------------------------------

/**
 * Document Type options
 */
export const DOCUMENT_TYPE_OPTIONS = [
  { id: 1, label: 'Purchase', color: 'info' },
  { id: 2, label: 'Adjustment', color: 'secondary' },
  { id: 3, label: 'Wastage', color: 'error' },
];

// ----------------------------------------------------------------------

/**
 * Status options
 */
export const STATUS_OPTIONS = [
  { id: 1, label: 'Draft', color: 'warning' },
  { id: 2, label: 'Posted', color: 'success' },
  { id: 3, label: 'Reversed', color: 'error' },
];

// ----------------------------------------------------------------------

/**
 * Get document type label
 */
export const getDocumentTypeLabel = (typeId) => {
  const type = DOCUMENT_TYPE_OPTIONS.find((option) => option.id === typeId);
  return type ? type.label : `Unknown (${typeId})`;
};

// ----------------------------------------------------------------------

/**
 * Get document type color
 */
export const getDocumentTypeColor = (typeId) => {
  const type = DOCUMENT_TYPE_OPTIONS.find((option) => option.id === typeId);
  return type ? type.color : 'default';
};

// ----------------------------------------------------------------------

/**
 * Get status label
 */
export const getStatusLabel = (statusId) => {
  const status = STATUS_OPTIONS.find((option) => option.id === statusId);
  return status ? status.label : `Unknown (${statusId})`;
};

// ----------------------------------------------------------------------

/**
 * Get status color
 */
export const getStatusColor = (statusId) => {
  const status = STATUS_OPTIONS.find((option) => option.id === statusId);
  return status ? status.color : 'default';
};

// ----------------------------------------------------------------------

/**
 * Check if document can be edited
 */
export const canEdit = (status) => status === 1; // Draft

// ----------------------------------------------------------------------

/**
 * Check if document can be deleted
 */
export const canDelete = (status) => status === 1; // Draft

// ----------------------------------------------------------------------

/**
 * Check if document can be posted
 */
export const canPost = (status) => status === 1; // Draft

