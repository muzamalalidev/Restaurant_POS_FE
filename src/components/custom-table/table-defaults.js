// ----------------------------------------------------------------------
// Default Configurations for CustomTable
// ----------------------------------------------------------------------

export const DEFAULT_PAGINATION = {
  enabled: true,
  mode: 'client',
  pageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
};

export const DEFAULT_SORTING = {
  enabled: false,
  mode: 'client',
  disableMultipleColumns: false,
};

export const DEFAULT_FILTERING = {
  enabled: false,
  mode: 'client',
  quickFilter: false,
  disableMultipleColumns: false,
};

export const DEFAULT_SELECTION = {
  enabled: false,
  checkboxSelection: false,
  disableRowSelectionOnClick: false,
};

export const DEFAULT_TOOLBAR = {
  show: false,
  quickFilter: false,
  export: false,
  columns: true,
  filter: false,
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

