'use client';

import { memo, useRef, useMemo, Component, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import { Toolbar, DataGrid, gridClasses } from '@mui/x-data-grid';

import { getApiErrorMessage } from 'src/utils/api-error-message';
import { useActionsColumn, createActionsColumn } from 'src/utils/create-actions-column';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import {
  useToolbarSettings,
  CustomToolbarQuickFilter,
  CustomToolbarExportButton,
  CustomToolbarFilterButton,
  CustomToolbarColumnsButton,
  CustomToolbarSettingsButton,
} from 'src/components/custom-data-grid';

import { useCustomTable } from './use-custom-table';
import {
  DEFAULT_TOOLBAR,
  DEFAULT_DENSITY,
  DEFAULT_ACTIONS_COLUMN,
} from './table-defaults';
import { normalizeRows, normalizeColumns, normalizeToolbar, hasConfirmationDialogs } from './table-utils';

// ----------------------------------------------------------------------
// CustomTable Component
// ----------------------------------------------------------------------

/**
 * CustomTable - A production-grade wrapper around MUI X DataGrid
 *
 * @param {object} props - Component props
 * @param {Array} props.rows - Data array (required)
 * @param {Array} props.columns - GridColDef array (required)
 * @param {boolean} props.loading - Loading state
 * @param {Array} props.actions - Actions config for createActionsColumn
 * @param {object} props.actionsColumnOptions - Options for actions column
 * @param {object|boolean} props.pagination - Pagination config
 * @param {object|boolean} props.sorting - Sorting config
 * @param {object|boolean} props.filtering - Filtering config
 * @param {object|boolean} props.selection - Row selection config
 * @param {object|boolean|ReactNode} props.toolbar - Toolbar config
 * @param {string} props.density - Row density: 'compact' | 'standard' | 'comfortable'
 * @param {number|string} props.height - Grid height
 * @param {object} props.sx - MUI sx prop
 * @param {object} props.slots - Custom DataGrid slots
 * @param {object} props.slotProps - Custom DataGrid slotProps
 * @param {Function} props.onRowClick - Row click handler
 * @param {Function} props.onCellClick - Cell click handler
 * @param {Function} props.onSelectionChange - Selection change handler
 * @param {Function} props.getRowId - Custom row ID getter
 * @param {Function} props.getRowClassName - Dynamic row className
 * @param {object} props.initialState - Initial grid state
 * @param {ReactNode} props.emptyContent - Custom empty content component
 * @param {unknown} props.error - RTK Query / API error; when set, table shows error state instead of grid
 * @param {Function} [props.onRetry] - Callback when user clicks Retry (e.g. refetch)
 * @param {string} [props.errorEntityLabel] - Label for error message, e.g. "recipes" -> "Error loading recipes"
 * @param {object} props.otherProps - All other DataGrid props
 */
function CustomTableComponent({
  rows: rowsProp = [],
  columns: columnsProp = [],
  loading = false,
  actions,
  actionsColumnOptions,
  pagination: paginationProp,
  sorting: sortingProp,
  filtering: filteringProp,
  selection: selectionProp,
  toolbar: toolbarProp,
  density: densityProp,
  height,
  sx,
  slots: slotsProp,
  slotProps: slotPropsProp,
  onRowClick,
  onCellClick,
  onSelectionChange,
  getRowId,
  getRowClassName,
  initialState: initialStateProp,
  emptyContent,
  error: errorProp,
  onRetry,
  errorEntityLabel = 'data',
  ...otherProps
}) {
  // Normalize and validate data with error handling
  const rows = useMemo(() => {
    try {
      return normalizeRows(rowsProp, getRowId);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('CustomTable: Error normalizing rows:', error);
      }
      return [];
    }
  }, [rowsProp, getRowId]);

  const baseColumns = useMemo(() => {
    try {
      return normalizeColumns(columnsProp);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('CustomTable: Error normalizing columns:', error);
      }
      return [];
    }
  }, [columnsProp]);

  // Memoize row IDs to prevent unnecessary re-renders
  const rowIdsRef = useRef(new Set());
  useEffect(() => {
    const newIds = new Set(rows.map((row) => row.id));
    const hasChanged = rowIdsRef.current.size !== newIds.size || 
      Array.from(rowIdsRef.current).some(id => !newIds.has(id));
    if (hasChanged) {
      rowIdsRef.current = newIds;
    }
  }, [rows]);

  // Check if actions need confirmation dialogs
  const needsConfirmationDialog = useMemo(() => hasConfirmationDialogs(actions), [actions]);

  // Handle actions column with confirmation support
  const actionsColumnResult = useActionsColumn(actions || [], {
    ...DEFAULT_ACTIONS_COLUMN,
    ...actionsColumnOptions,
  });

  // Merge actions column if actions provided
  const columns = useMemo(() => {
    if (!actions || actions.length === 0) {
      return baseColumns;
    }

    const actionsColumn = needsConfirmationDialog
      ? actionsColumnResult.column
      : createActionsColumn(actions, {
          ...DEFAULT_ACTIONS_COLUMN,
          ...actionsColumnOptions,
        });

    if (!actionsColumn) {
      return baseColumns;
    }

    // Check if actions column already exists
    const hasActionsColumn = baseColumns.some((col) => col.type === 'actions' || col.field === 'actions');

    if (hasActionsColumn) {
      return baseColumns;
    }

    return [...baseColumns, actionsColumn];
  }, [baseColumns, actions, actionsColumnOptions, needsConfirmationDialog, actionsColumnResult.column]);

  // Use custom table hook for state management
  const tableState = useCustomTable({
    rows,
    pagination: paginationProp,
    sorting: sortingProp,
    filtering: filteringProp,
    selection: selectionProp,
    getRowId,
    onSelectionChange,
    onPageChange: otherProps.onPageChange,
    onPageSizeChange: otherProps.onPageSizeChange,
    onSortModelChange: otherProps.onSortModelChange,
    onFilterModelChange: otherProps.onFilterModelChange,
  });

  // Normalize toolbar configuration
  const toolbarConfig = useMemo(() => normalizeToolbar(toolbarProp ?? DEFAULT_TOOLBAR), [toolbarProp]);

  // Toolbar settings hook
  const toolbarSettings = useToolbarSettings(
    useMemo(
      () => ({
        density: densityProp || DEFAULT_DENSITY,
      }),
      [densityProp]
    )
  );

  // Build toolbar component
  const toolbarComponent = useMemo(() => {
    if (toolbarConfig === false || (typeof toolbarConfig === 'object' && !toolbarConfig.show)) {
      return null;
    }

    if (typeof toolbarConfig === 'object' && toolbarConfig.custom) {
      return toolbarConfig.custom;
    }

    if (typeof toolbarConfig === 'object' && toolbarConfig.show) {
      return (
        <CustomToolbar
          settings={toolbarSettings.settings}
          onChangeSettings={toolbarSettings.onChangeSettings}
          config={toolbarConfig}
        />
      );
    }

    return null;
  }, [toolbarConfig, toolbarSettings]);

  // Build slots
  const slots = useMemo(() => {
    const defaultSlots = {
      noRowsOverlay: () => (emptyContent || <EmptyContent />),
      noResultsOverlay: () => (emptyContent || <EmptyContent title="No results found" />),
    };

    if (toolbarComponent) {
      defaultSlots.toolbar = () => toolbarComponent;
    } else if (toolbarProp === false) {
      // Only hide when explicitly toolbar={false}; otherwise DataGrid can show its default toolbar
      defaultSlots.toolbar = () => null;
    }

    return {
      ...defaultSlots,
      ...slotsProp,
    };
  }, [toolbarComponent, toolbarProp, slotsProp, emptyContent]);

  // Build slotProps
  const slotProps = useMemo(() => {
    const defaultSlotProps = {};

    if (toolbarConfig && typeof toolbarConfig === 'object' && toolbarConfig.columns !== false) {
      defaultSlotProps.columnsManagement = {
        getTogglableColumns: () => columns
            .filter((col) => {
              if (col.type === 'actions') return false;
              if (col.field === 'actions') return false;
              if (col.hideable === false) return false;
              return col.field;
            })
            .map((col) => col.field),
      };
    }

    // Force toolbar quick filter off unless explicitly enabled (overrides any consumer slotProps.toolbar.showQuickFilter)
    const toolbarQuickFilterEnabled = typeof toolbarConfig === 'object' && toolbarConfig.quickFilter === true;
    defaultSlotProps.toolbar = {
      ...slotPropsProp?.toolbar,
      showQuickFilter: toolbarQuickFilterEnabled,
    };

    return {
      ...defaultSlotProps,
      ...slotPropsProp,
      toolbar: {
        ...slotPropsProp?.toolbar,
        showQuickFilter: toolbarQuickFilterEnabled,
      },
    };
  }, [columns, toolbarConfig, slotPropsProp]);

  // Performance optimization: Enable virtualization for large datasets
  const shouldEnableVirtualization = useMemo(() => rows.length > 1000, [rows.length]);

  // Build DataGrid props
  const dataGridProps = useMemo(() => {
    const props = {
      rows,
      columns,
      loading,
      ...otherProps,
    };

    // Enable virtualization for large datasets
    if (shouldEnableVirtualization) {
      props.disableVirtualization = false;
    }

    // Pagination
    if (tableState.paginationConfig.enabled) {
      props.paginationModel = tableState.paginationModel;
      props.onPaginationModelChange = tableState.handlePaginationModelChange;
      props.pageSizeOptions = tableState.paginationConfig.pageSizeOptions;

      if (tableState.paginationConfig.mode === 'server') {
        props.paginationMode = 'server';
        if (tableState.paginationConfig.rowCount !== undefined) {
          props.rowCount = tableState.paginationConfig.rowCount;
        }
      }
    } else {
      props.pagination = false;
    }

    // Sorting
    if (tableState.sortingConfig.enabled) {
      props.sortModel = tableState.sortModel;
      props.onSortModelChange = tableState.handleSortModelChange;

      if (tableState.sortingConfig.mode === 'server') {
        props.sortingMode = 'server';
      }

      if (tableState.sortingConfig.disableMultipleColumns) {
        props.disableMultipleColumnsSorting = true;
      }
    } else {
      props.disableColumnSorting = true;
    }

    // Filtering
    if (tableState.filteringConfig.enabled) {
      // Ensure filterModel has the correct structure with items array
      props.filterModel = tableState.filterModel?.items
        ? tableState.filterModel
        : { items: [] };
      props.onFilterModelChange = tableState.handleFilterModelChange;

      if (tableState.filteringConfig.mode === 'server') {
        props.filterMode = 'server';
      }

      if (tableState.filteringConfig.disableMultipleColumns) {
        props.disableMultipleColumnsFiltering = true;
      }

      if (!tableState.filteringConfig.quickFilter) {
        props.disableQuickFilter = true;
      }
    } else {
      props.disableColumnFilter = true;
    }

    // Keep quick filter disabled unless toolbar explicitly enables it (toolbar config wins over filtering config for toolbar UX)
    const toolbarQuickFilterOn = typeof toolbarConfig === 'object' && toolbarConfig.quickFilter === true;
    if (!toolbarQuickFilterOn) {
      props.disableQuickFilter = true;
    }

    // Selection
    if (tableState.selectionConfig.enabled) {
      props.checkboxSelection = tableState.selectionConfig.checkboxSelection;
      props.disableRowSelectionOnClick = tableState.selectionConfig.disableRowSelectionOnClick;
      // Ensure rowSelectionModel is always an array
      props.rowSelectionModel = Array.isArray(tableState.selectionModel) ? tableState.selectionModel : [];
      props.onRowSelectionModelChange = tableState.handleSelectionModelChange;

      if (tableState.selectionConfig.isRowSelectable) {
        props.isRowSelectable = tableState.selectionConfig.isRowSelectable;
      }
    } else {
      // When selection is disabled, explicitly turn off DataGrid row selection.
      // DataGrid defaults rowSelection to true, so without this, row click still selects and shows "X row(s) selected".
      props.rowSelection = false;
      props.hideFooterSelectedRowCount = true;
    }

    // Density
    if (toolbarSettings.settings.density) {
      props.density = toolbarSettings.settings.density;
    }

    // Height - Make it flexible when there's no data to show empty content properly
    const hasData = rows.length > 0;
    if (!hasData) {
      // When there's no data, enable autoHeight so the grid expands to show empty content
      props.autoHeight = true;
      if (height) {
        props.sx = {
          minHeight: 400, // Minimum height to show empty content properly
          ...sx,
        };
      } else if (sx) {
        props.sx = {
          ...sx,
          minHeight: 400, // Ensure empty content is visible
        };
      } else {
        props.sx = {
          minHeight: 400, // Ensure empty content is visible when no data
        };
      }
    } else if (height) {
      props.sx = {
        height,
        ...sx,
      };
    } else if (sx) {
      props.sx = sx;
    }

    // Row ID
    if (getRowId) {
      props.getRowId = getRowId;
    }

    // Row className
    if (getRowClassName) {
      props.getRowClassName = getRowClassName;
    }

    // Event handlers
    if (onRowClick) {
      props.onRowClick = onRowClick;
    }

    if (onCellClick) {
      props.onCellClick = onCellClick;
    }

    // Initial state
    if (initialStateProp) {
      props.initialState = initialStateProp;
    } else if (tableState.paginationConfig.enabled) {
      props.initialState = {
        pagination: {
          paginationModel: {
            page: tableState.paginationModel.page,
            pageSize: tableState.paginationModel.pageSize,
          },
        },
      };
    }

    // Slots
    props.slots = slots;

    // SlotProps
    props.slotProps = slotProps;

    return props;
  }, [
    rows,
    columns,
    loading,
    tableState,
    toolbarConfig,
    toolbarSettings.settings.density,
    height,
    sx,
    getRowId,
    getRowClassName,
    onRowClick,
    onCellClick,
    initialStateProp,
    slots,
    slotProps,
    shouldEnableVirtualization,
    otherProps,
  ]);

  // Handle empty columns
  if (columns.length === 0) {
    return <EmptyContent title="No columns defined" description="Please provide at least one column definition." />;
  }

  // API error state: show error in table area (inline UX), use getApiErrorMessage for message and isRetryable
  if (errorProp) {
    const { message, isRetryable } = getApiErrorMessage(errorProp, {
      defaultMessage: `Error loading ${errorEntityLabel}`,
    });
    const title = `Error loading ${errorEntityLabel}`;
    return (
      <Card sx={{ p: 6 }}>
        <EmptyContent
          title={title}
          description={message}
          action={
            isRetryable && onRetry ? (
              <Button variant="contained" onClick={onRetry} startIcon={<Iconify icon="solar:refresh-bold" />}>
                Retry
              </Button>
            ) : null
          }
        />
      </Card>
    );
  }

  // Edge case: Handle empty rows (already handled by DataGrid's noRowsOverlay slot)

  return (
    <TableErrorBoundary>
      <DataGrid
        {...dataGridProps}
        sx={[
          {
            [`& .${gridClasses.cell}`]: {
              display: 'flex',
              alignItems: 'center',
            },
          },
          ...(Array.isArray(dataGridProps.sx) ? dataGridProps.sx : [dataGridProps.sx]),
        ]}
      />
      {needsConfirmationDialog && actionsColumnResult.ConfirmationDialog}
    </TableErrorBoundary>
  );
}

// ----------------------------------------------------------------------
// Error Boundary Component
// ----------------------------------------------------------------------

class TableErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('CustomTable Error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return <EmptyContent title="Error loading table" description="Please refresh the page." />;
    }

    return this.props.children;
  }
}

// ----------------------------------------------------------------------
// Memoized Export
// ----------------------------------------------------------------------

export const CustomTable = memo(CustomTableComponent, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  if (
    prevProps.rows !== nextProps.rows ||
    prevProps.columns !== nextProps.columns ||
    prevProps.loading !== nextProps.loading ||
    prevProps.actions !== nextProps.actions ||
    prevProps.pagination !== nextProps.pagination ||
    prevProps.sorting !== nextProps.sorting ||
    prevProps.filtering !== nextProps.filtering ||
    prevProps.selection !== nextProps.selection ||
    prevProps.toolbar !== nextProps.toolbar ||
    prevProps.density !== nextProps.density ||
    prevProps.height !== nextProps.height ||
    prevProps.error !== nextProps.error ||
    prevProps.onRetry !== nextProps.onRetry ||
    prevProps.errorEntityLabel !== nextProps.errorEntityLabel
  ) {
    return false;
  }
  return true;
});

// ----------------------------------------------------------------------
// Custom Toolbar Component
// ----------------------------------------------------------------------

function CustomToolbar({ settings, onChangeSettings, config }) {
  return (
    <Toolbar>
      {config.quickFilter === true && <CustomToolbarQuickFilter />}
      <Box component="span" sx={{ flexGrow: 1 }} />
      {config.customActions && <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>{config.customActions}</Box>}
      {config.columns !== false && <CustomToolbarColumnsButton />}
      {config.filter === true && <CustomToolbarFilterButton />}
      {config.export !== false && <CustomToolbarExportButton />}
      {config.settings !== false && (
        <CustomToolbarSettingsButton settings={settings} onChangeSettings={onChangeSettings} />
      )}
    </Toolbar>
  );
}


