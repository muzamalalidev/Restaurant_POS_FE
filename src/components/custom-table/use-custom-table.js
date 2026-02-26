import { useMemo, useState, useCallback } from 'react';

import { DEFAULT_SORTING, DEFAULT_FILTERING, DEFAULT_SELECTION, DEFAULT_PAGINATION } from './table-defaults';
import {
  getSafePage,
  normalizeSorting,
  getValidPageSize,
  normalizeFiltering,
  normalizeSelection,
  normalizePagination,
} from './table-utils';

// ----------------------------------------------------------------------
// Custom Hook for CustomTable State Management
// ----------------------------------------------------------------------

/**
 * Custom hook for managing CustomTable internal state
 * @param {object} props - Component props
 * @returns {object} - State and handlers
 */
export function useCustomTable({
  rows = [],
  pagination: paginationProp,
  sorting: sortingProp,
  filtering: filteringProp,
  selection: selectionProp,
  getRowId,
  onSelectionChange: onSelectionChangeProp,
  onPageChange: onPageChangeProp,
  onPageSizeChange: onPageSizeChangeProp,
  onSortModelChange: onSortModelChangeProp,
  onFilterModelChange: onFilterModelChangeProp,
}) {
  // Normalize configurations
  const paginationConfig = useMemo(
    () => normalizePagination(paginationProp ?? DEFAULT_PAGINATION),
    [paginationProp]
  );

  const sortingConfig = useMemo(() => normalizeSorting(sortingProp ?? DEFAULT_SORTING), [sortingProp]);

  const filteringConfig = useMemo(
    () => normalizeFiltering(filteringProp ?? DEFAULT_FILTERING),
    [filteringProp]
  );

  const selectionConfig = useMemo(
    () => normalizeSelection(selectionProp ?? DEFAULT_SELECTION),
    [selectionProp]
  );

  // Pagination state
  const [paginationModel, setPaginationModel] = useState(() => {
    const initialPageSize = paginationConfig.pageSize || DEFAULT_PAGINATION.pageSize;
    return {
      page: 0,
      pageSize: initialPageSize,
    };
  });

  // Sorting state
  const [sortModel, setSortModel] = useState(sortingConfig.sortModel || []);

  // Filtering state - DataGrid requires filterModel to have items array
  const [filterModel, setFilterModel] = useState(() => {
    if (filteringConfig.filterModel && filteringConfig.filterModel.items) {
      return filteringConfig.filterModel;
    }
    return { items: [] };
  });

  // Selection state - Always ensure it's an array
  const [selectionModel, setSelectionModel] = useState(() => Array.isArray(selectionConfig.selectionModel) ? selectionConfig.selectionModel : []);

  // Calculate total rows for pagination
  const totalRows = useMemo(() => {
    if (paginationConfig.mode === 'server' && paginationConfig.rowCount !== undefined) {
      return paginationConfig.rowCount;
    }
    return rows.length;
  }, [paginationConfig.mode, paginationConfig.rowCount, rows.length]);

  // Handle pagination change with edge case handling
  const handlePaginationModelChange = useCallback(
    (newModel) => {
      // For server-side pagination, don't validate page bounds
      if (paginationConfig.mode === 'server') {
        const validPageSize = getValidPageSize(
          newModel.pageSize,
          paginationConfig.pageSizeOptions,
          DEFAULT_PAGINATION.pageSize
        );

        const safeModel = {
          page: Math.max(0, newModel.page),
          pageSize: validPageSize,
        };

        setPaginationModel(safeModel);

        if (onPageChangeProp) {
          onPageChangeProp(safeModel.page);
        }

        if (onPageSizeChangeProp) {
          onPageSizeChangeProp(validPageSize);
        }

        if (paginationConfig.onPageChange) {
          paginationConfig.onPageChange(safeModel.page);
        }

        if (paginationConfig.onPageSizeChange) {
          paginationConfig.onPageSizeChange(validPageSize);
        }
      } else {
        // Client-side pagination: validate page bounds
        const safePage = getSafePage(newModel.page, totalRows, newModel.pageSize);
        const validPageSize = getValidPageSize(
          newModel.pageSize,
          paginationConfig.pageSizeOptions,
          DEFAULT_PAGINATION.pageSize
        );

        const safeModel = {
          page: safePage,
          pageSize: validPageSize,
        };

        setPaginationModel(safeModel);

        if (onPageChangeProp) {
          onPageChangeProp(safeModel.page);
        }

        if (onPageSizeChangeProp) {
          onPageSizeChangeProp(validPageSize);
        }

        if (paginationConfig.onPageChange) {
          paginationConfig.onPageChange(safeModel.page);
        }

        if (paginationConfig.onPageSizeChange) {
          paginationConfig.onPageSizeChange(validPageSize);
        }
      }
    },
    [
      totalRows,
      paginationConfig,
      onPageChangeProp,
      onPageSizeChangeProp,
    ]
  );

  // Handle sort model change
  const handleSortModelChange = useCallback(
    (newModel) => {
      setSortModel(newModel);

      if (onSortModelChangeProp) {
        onSortModelChangeProp(newModel);
      }

      if (sortingConfig.onSortModelChange) {
        sortingConfig.onSortModelChange(newModel);
      }
    },
    [sortingConfig, onSortModelChangeProp]
  );

  // Handle filter model change
  const handleFilterModelChange = useCallback(
    (newModel) => {
      setFilterModel(newModel);

      if (onFilterModelChangeProp) {
        onFilterModelChangeProp(newModel);
      }

      if (filteringConfig.onFilterModelChange) {
        filteringConfig.onFilterModelChange(newModel);
      }
    },
    [filteringConfig, onFilterModelChangeProp]
  );

  // Handle selection change
  const handleSelectionModelChange = useCallback(
    (newModel) => {
      setSelectionModel(newModel);

      if (onSelectionChangeProp) {
        onSelectionChangeProp(newModel);
      }

      if (selectionConfig.onSelectionChange) {
        selectionConfig.onSelectionChange(newModel);
      }
    },
    [selectionConfig, onSelectionChangeProp]
  );

  // Sync controlled props
  useMemo(() => {
    if (sortingConfig.sortModel !== undefined) {
      setSortModel(sortingConfig.sortModel);
    }
  }, [sortingConfig.sortModel]);

  useMemo(() => {
    if (filteringConfig.filterModel !== undefined) {
      // Ensure filterModel has the correct structure
      const newFilterModel = filteringConfig.filterModel?.items
        ? filteringConfig.filterModel
        : { items: [] };
      setFilterModel(newFilterModel);
    }
  }, [filteringConfig.filterModel]);

  useMemo(() => {
    if (selectionConfig.selectionModel !== undefined) {
      // Ensure selectionModel is always an array
      const newSelectionModel = Array.isArray(selectionConfig.selectionModel)
        ? selectionConfig.selectionModel
        : [];
      setSelectionModel(newSelectionModel);
    }
  }, [selectionConfig.selectionModel]);

  return {
    // Configurations
    paginationConfig,
    sortingConfig,
    filteringConfig,
    selectionConfig,

    // State
    paginationModel,
    sortModel,
    filterModel,
    selectionModel,
    totalRows,

    // Handlers
    handlePaginationModelChange,
    handleSortModelChange,
    handleFilterModelChange,
    handleSelectionModelChange,
  };
}

