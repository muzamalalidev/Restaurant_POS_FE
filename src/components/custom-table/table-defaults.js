// ----------------------------------------------------------------------
// Default Configurations for CustomTable
// ----------------------------------------------------------------------

export const DEFAULT_PAGINATION = {
  enabled: true,
  mode: 'client',
  pageSize: 10,
  pageSizeOptions: [5, 10, 20, 50, 100],
};

export const DEFAULT_SORTING = {
  enabled: true,
  mode: 'client',
  disableMultipleColumns: false,
};

export const DEFAULT_FILTERING = {
  enabled: true,
  mode: 'client',
  quickFilter: true,
  disableMultipleColumns: false,
};

export const DEFAULT_SELECTION = {
  enabled: false,
  checkboxSelection: false,
  disableRowSelectionOnClick: false,
};

export const DEFAULT_TOOLBAR = {
  show: true,
  quickFilter: true,
  export: false,
  columns: true,
  filter: true,
  settings: true,
  position: 'top',
};

export const DEFAULT_DENSITY = 'standard';

export const DEFAULT_ACTIONS_COLUMN = {
  field: 'actions',
  headerName: 'Actions',
  // width is not set here - it will be calculated dynamically based on number of actions
  // If explicit width is needed, it can be provided via actionsColumnOptions
  align: 'right',
  headerAlign: 'right',
  sortable: false,
  filterable: false,
  disableColumnMenu: true,
  hideInMenu: false,
};

export const DEFAULT_GRID_HEIGHT = 400;

export const DEFAULT_PAGE_SIZE = 10;

