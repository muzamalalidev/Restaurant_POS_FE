import { isValidElement } from 'react';

import { DEFAULT_TOOLBAR } from './table-defaults';

// ----------------------------------------------------------------------
// Utility Functions for CustomTable
// ----------------------------------------------------------------------

/**
 * Validates and normalizes rows data
 * @param {Array} rows - Raw rows data
 * @param {Function} getRowId - Custom row ID getter
 * @returns {Array} - Normalized rows with valid IDs
 */
export function normalizeRows(rows, getRowId) {
  if (!Array.isArray(rows)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CustomTable: rows must be an array. Received:', typeof rows);
    }
    return [];
  }

  const normalizedRows = [];
  const seenIds = new Set();

  rows.forEach((row, index) => {
    if (row === null || row === undefined) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`CustomTable: Row at index ${index} is null or undefined. Skipping.`);
      }
      return;
    }

    let rowId;
    if (getRowId) {
      try {
        rowId = getRowId(row);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`CustomTable: Error in getRowId for row at index ${index}:`, error);
        }
        rowId = `row-${index}`;
      }
    } else {
      rowId = row.id ?? row._id ?? `row-${index}`;
    }

    if (rowId === null || rowId === undefined) {
      rowId = `row-${index}`;
    }

    if (seenIds.has(rowId)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`CustomTable: Duplicate row ID detected: ${rowId}. Using index-based ID.`);
      }
      rowId = `row-${index}`;
    }

    seenIds.add(rowId);
    normalizedRows.push({ ...row, id: rowId });
  });

  return normalizedRows;
}

/**
 * Validates and normalizes columns data
 * @param {Array} columns - Raw columns data
 * @returns {Array} - Normalized columns
 */
export function normalizeColumns(columns) {
  if (!Array.isArray(columns)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CustomTable: columns must be an array. Received:', typeof columns);
    }
    return [];
  }

  if (columns.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CustomTable: columns array is empty.');
    }
    return [];
  }

  const normalizedColumns = [];
  const seenFields = new Set();

  columns.forEach((column, index) => {
    if (!column) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`CustomTable: Column at index ${index} is null or undefined. Skipping.`);
      }
      return;
    }

    if (!column.field && column.type !== 'actions') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `CustomTable: Column at index ${index} is missing 'field' property and is not an actions column. Skipping.`
        );
      }
      return;
    }

    if (column.field && seenFields.has(column.field)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`CustomTable: Duplicate column field detected: ${column.field}. Skipping duplicate.`);
      }
      return;
    }

    if (column.field) {
      seenFields.add(column.field);
    }

    normalizedColumns.push(column);
  });

  return normalizedColumns;
}

/**
 * Validates pagination configuration
 * @param {object|boolean} pagination - Pagination config
 * @returns {object} - Normalized pagination config
 */
export function normalizePagination(pagination) {
  if (pagination === false || pagination === null) {
    return { enabled: false };
  }

  if (pagination === true || pagination === undefined) {
    return { enabled: true };
  }

  if (typeof pagination !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CustomTable: pagination must be an object, boolean, or undefined. Using defaults.');
    }
    return { enabled: true };
  }

  return {
    enabled: pagination.enabled !== false,
    mode: pagination.mode || 'client',
    pageSize: pagination.pageSize || 10,
    pageSizeOptions: pagination.pageSizeOptions || [5, 10, 20, 50, 100],
    rowCount: pagination.rowCount,
    onPageChange: pagination.onPageChange,
    onPageSizeChange: pagination.onPageSizeChange,
  };
}

/**
 * Validates sorting configuration
 * @param {object|boolean} sorting - Sorting config
 * @returns {object} - Normalized sorting config
 */
export function normalizeSorting(sorting) {
  if (sorting === false || sorting === null) {
    return { enabled: false };
  }

  if (sorting === true || sorting === undefined) {
    return { enabled: true };
  }

  if (typeof sorting !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CustomTable: sorting must be an object, boolean, or undefined. Using defaults.');
    }
    return { enabled: true };
  }

  return {
    enabled: sorting.enabled !== false,
    mode: sorting.mode || 'client',
    sortModel: sorting.sortModel,
    onSortModelChange: sorting.onSortModelChange,
    disableMultipleColumns: sorting.disableMultipleColumns || false,
  };
}

/**
 * Validates filtering configuration
 * @param {object|boolean} filtering - Filtering config
 * @returns {object} - Normalized filtering config
 */
export function normalizeFiltering(filtering) {
  if (filtering === false || filtering === null) {
    return { enabled: false };
  }

  if (filtering === true || filtering === undefined) {
    return { enabled: true };
  }

  if (typeof filtering !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CustomTable: filtering must be an object, boolean, or undefined. Using defaults.');
    }
    return { enabled: true };
  }

  return {
    enabled: filtering.enabled !== false,
    mode: filtering.mode || 'client',
    filterModel: filtering.filterModel,
    onFilterModelChange: filtering.onFilterModelChange,
    quickFilter: filtering.quickFilter !== false,
    disableMultipleColumns: filtering.disableMultipleColumns || false,
  };
}

/**
 * Validates selection configuration
 * @param {object|boolean} selection - Selection config
 * @returns {object} - Normalized selection config
 */
export function normalizeSelection(selection) {
  if (selection === false || selection === null) {
    return { enabled: false };
  }

  if (selection === true || selection === undefined) {
    return { enabled: true, checkboxSelection: true };
  }

  if (typeof selection !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CustomTable: selection must be an object, boolean, or undefined. Using defaults.');
    }
    return { enabled: true, checkboxSelection: true };
  }

  return {
    enabled: selection.enabled !== false,
    checkboxSelection: selection.checkboxSelection !== false,
    disableRowSelectionOnClick: selection.disableRowSelectionOnClick || false,
    selectionModel: selection.selectionModel,
    onSelectionChange: selection.onSelectionChange,
    isRowSelectable: selection.isRowSelectable,
  };
}

/**
 * Validates toolbar configuration
 * @param {object|boolean|ReactNode} toolbar - Toolbar config
 * @returns {object|ReactNode} - Normalized toolbar config
 */
export function normalizeToolbar(toolbar) {
  if (toolbar === false || toolbar === null) {
    return { show: false };
  }

  if (toolbar === true || toolbar === undefined) {
    return { ...DEFAULT_TOOLBAR, show: true };
  }

  if (typeof toolbar === 'object' && !toolbar.$$typeof && !isValidElement(toolbar)) {
    return {
      show: toolbar.show !== false,
      quickFilter: toolbar.quickFilter === true,
      export: toolbar.export || false,
      columns: toolbar.columns !== false,
      filter: toolbar.filter !== false,
      settings: toolbar.settings !== false,
      custom: toolbar.custom,
      customActions: toolbar.customActions,
      position: toolbar.position || 'top',
    };
  }

  return toolbar;
}

/**
 * Calculates safe page number based on total rows and page size
 * @param {number} page - Requested page number
 * @param {number} totalRows - Total number of rows
 * @param {number} pageSize - Page size
 * @returns {number} - Safe page number
 */
export function getSafePage(page, totalRows, pageSize) {
  if (!totalRows || totalRows === 0) {
    return 0;
  }

  const maxPage = Math.max(0, Math.ceil(totalRows / pageSize) - 1);
  return Math.max(0, Math.min(page, maxPage));
}

/**
 * Validates page size
 * @param {number} pageSize - Requested page size
 * @param {Array} pageSizeOptions - Available page size options
 * @param {number} defaultPageSize - Default page size
 * @returns {number} - Valid page size
 */
export function getValidPageSize(pageSize, pageSizeOptions, defaultPageSize) {
  if (!pageSize || pageSize <= 0) {
    return defaultPageSize;
  }

  if (pageSizeOptions && pageSizeOptions.length > 0) {
    const validSizes = pageSizeOptions.filter((size) => typeof size === 'number' && size > 0);
    if (validSizes.length > 0 && !validSizes.includes(pageSize)) {
      return defaultPageSize;
    }
  }

  return pageSize;
}

/**
 * Checks if actions array has confirmation dialogs
 * @param {Array} actions - Actions array
 * @returns {boolean} - True if any action has confirm property
 */
export function hasConfirmationDialogs(actions) {
  if (!Array.isArray(actions)) {
    return false;
  }

  return actions.some((action) => action && action.confirm);
}

