import { useMemo, useState, useCallback } from 'react';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { Iconify } from 'src/components/iconify';
import { CustomGridActionsCellItem } from 'src/components/custom-data-grid';

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

/**
 * Normalizes icon prop - handles string (iconify), function, or ReactNode
 * @param {string|function|ReactNode} icon - Icon as string, function, or ReactNode
 * @param {object} row - Row data for function evaluation
 * @returns {ReactNode|null} - Normalized icon component or null
 */
function normalizeIcon(icon, row) {
  if (!icon) return null;
  if (typeof icon === 'function') {
    try {
      const iconValue = icon(row);
      if (typeof iconValue === 'string') {
        return <Iconify icon={iconValue} />;
      }
      return iconValue || null;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('createActionsColumn: Error evaluating icon function:', error);
      }
      return null;
    }
  }
  if (typeof icon === 'string') {
    return <Iconify icon={icon} />;
  }
  return icon;
}

/**
 * Evaluates conditional value - handles boolean or function
 * @param {boolean|function} condition - Condition value or function
 * @param {object} row - Row data for function evaluation
 * @returns {boolean} - Evaluated condition result
 */
function evaluateCondition(condition, row) {
  if (typeof condition === 'function') {
    try {
      return condition(row);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('createActionsColumn: Error evaluating condition function:', error);
      }
      return false;
    }
  }
  return condition !== false && condition !== null && condition !== undefined;
}

/**
 * Gets href value - handles string or function
 * @param {string|function} href - Href value or function
 * @param {object} row - Row data for function evaluation
 * @returns {string|null} - Href value or null
 */
function getHref(href, row) {
  if (!href) return null;
  if (typeof href === 'function') {
    try {
      return href(row);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('createActionsColumn: Error evaluating href function:', error);
      }
      return null;
    }
  }
  return href;
}

/**
 * Confirmation Dialog Component
 */
function ConfirmationDialog({ open, onClose, onConfirm, title, message, confirmText, cancelText }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title || 'Confirm Action'}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message || 'Are you sure you want to proceed?'}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText || 'Cancel'}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          {confirmText || 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// Main Function
// ----------------------------------------------------------------------

/**
 * Creates a DataGrid actions column configuration from action definitions
 * 
 * @param {Array} actions - Array of action configuration objects
 * @param {object} options - Optional column configuration
 * @param {string} options.field - Column field name (default: 'actions')
 * @param {string} options.headerName - Column header (default: 'Actions')
 * @param {number} options.width - Column width (default: 120)
 * @param {string} options.align - Column alignment (default: 'right')
 * @param {string} options.headerAlign - Header alignment (default: 'right')
 * @param {boolean} options.hideInMenu - Hide in column menu (default: false)
 * @param {boolean} options.sortable - Enable sorting (default: false)
 * @param {boolean} options.filterable - Enable filtering (default: false)
 * @param {boolean} options.disableColumnMenu - Disable column menu (default: true)
 * @returns {object} - DataGrid actions column configuration
 * 
 * @example
 * const actions = [
 *   {
 *     id: 'view',
 *     label: 'View',
 *     icon: 'solar:eye-bold',
 *     onClick: (row) => console.log('View:', row),
 *   },
 *   {
 *     id: 'edit',
 *     label: 'Edit',
 *     icon: 'solar:pen-bold',
 *     href: (row) => `/users/${row.id}/edit`,
 *   },
 *   {
 *     id: 'delete',
 *     label: 'Delete',
 *     icon: 'solar:trash-bin-trash-bold',
 *     onClick: (row) => handleDelete(row),
 *     confirm: {
 *       title: 'Delete User',
 *       message: 'Are you sure you want to delete this user?',
 *     },
 *     visible: (row) => row.status !== 'deleted',
 *     disabled: (row) => row.locked,
 *   },
 * ];
 * 
 * const columns = [
 *   ...otherColumns,
 *   createActionsColumn(actions),
 * ];
 */
export function createActionsColumn(actions = [], options = {}) {
  // Validate actions array
  if (!Array.isArray(actions)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('createActionsColumn: actions must be an array. Received:', typeof actions);
    }
    return null;
  }

  // Validate action IDs for duplicates
  if (process.env.NODE_ENV !== 'production') {
    const actionIds = actions.map((action) => action?.id).filter(Boolean);
    const duplicateIds = actionIds.filter((id, index) => actionIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.warn(`createActionsColumn: Duplicate action IDs detected: ${duplicateIds.join(', ')}`);
    }
  }

  // Default options
  const {
    field = 'actions',
    headerName = 'Actions',
    width: widthOption,
    align = 'right',
    headerAlign = 'right',
    hideInMenu = false,
    sortable = false,
    filterable = false,
    disableColumnMenu = true,
  } = options;

  // Return null if no actions (hide column)
  if (actions.length === 0) {
    return null;
  }

  // Calculate width dynamically based on number of actions if width not explicitly provided
  // Each action button typically needs ~48-52px (including padding, spacing, and Tooltip wrapper)
  // Base width: 32px (for column padding), per action: 48px
  const calculateWidth = () => {
    if (widthOption !== undefined) {
      return widthOption; // Use explicit width if provided
    }
    // Calculate: base padding (32px) + (number of actions * 48px per action)
    // Increased from 44px to 48px per action to account for Tooltip wrapper and prevent overlapping
    return 32 + actions.length * 48;
  };

  const width = calculateWidth();

  // Create actions column configuration
  // Use both width and minWidth to ensure column doesn't shrink below calculated width
  // This is important when other columns use flex: 1
  const columnConfig = {
    type: 'actions',
    field,
    headerName,
    width,
    minWidth: width, // Prevent column from shrinking below calculated width
    align,
    headerAlign,
    sortable,
    filterable,
    disableColumnMenu,
    hideInMenu,
    getActions: (params) => {
      const { row } = params;
      const actionElements = [];

      // Sort actions by order property (ascending)
      const sortedActions = [...actions].sort((a, b) => {
        const orderA = a.order ?? actions.indexOf(a);
        const orderB = b.order ?? actions.indexOf(b);
        return orderA - orderB;
      });

      // Process each action
      sortedActions.forEach((action, index) => {
        // Validate required props
        if (!action.id) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`createActionsColumn: Action at index ${index} is missing required 'id' property`);
          }
          return;
        }

        if (!action.label) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`createActionsColumn: Action '${action.id}' is missing required 'label' property`);
          }
          return;
        }

        if (!action.icon && !action.onClick && !action.href) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `createActionsColumn: Action '${action.id}' must have either 'icon', 'onClick', or 'href' property`
            );
          }
          return;
        }

        // Check visibility
        const isVisible = action.visible !== undefined ? evaluateCondition(action.visible, row) : true;
        if (!isVisible) {
          return;
        }

        // Check permission
        if (action.permission && !evaluateCondition(action.permission, row)) {
          return;
        }

        // Check disabled state
        const isDisabled = action.disabled !== undefined ? evaluateCondition(action.disabled, row) : false;

        // Get loading state
        const isLoading = action.loading !== undefined ? evaluateCondition(action.loading, row) : false;

        // Get href
        const href = getHref(action.href, row);

        // Normalize icon (handle function-based icons)
        const icon = normalizeIcon(action.icon, row);

        // Get label (handle function-based labels)
        const label = typeof action.label === 'function' ? action.label(row) : action.label;

        // Handle confirmation dialog
        const handleActionClick = () => {
          if (action.confirm) {
            // For confirmation, we need to use a hook-based approach
            // This will be handled by the wrapper component
            if (action.onClick) {
              action.onClick(row, params);
            }
          } else {
            if (action.onClick) {
              try {
                action.onClick(row, params);
              } catch (error) {
                if (process.env.NODE_ENV !== 'production') {
                  console.error(`createActionsColumn: Error in onClick handler for action '${action.id}':`, error);
                }
              }
            }
          }
        };

        // Build action props (excluding key - React key must be passed directly)
        const actionProps = {
          label,
          icon,
          disabled: isDisabled || isLoading,
          showInMenu: action.showInMenu ?? false,
          href,
          onClick: href ? undefined : handleActionClick,
          style: action.style,
          color: action.color,
        };

        // Add separator if specified
        if (action.separator && index > 0) {
          // Note: Separators in DataGrid actions are typically handled via CSS or menu structure
          // For now, we'll add a visual indicator via style
          actionProps.style = {
            ...actionProps.style,
            borderLeft: '1px solid',
            borderColor: 'divider',
            paddingLeft: 1,
            marginLeft: 0.5,
          };
        }

        // Create action element with key passed directly (not in spread)
        // Wrap with Tooltip to show label on hover for better UX
        // Use span wrapper to ensure Tooltip works correctly with interactive elements
        // Set width to auto to prevent span from taking extra space.
        // Stop propagation so the first click performs the action instead of the grid row/cell
        // consuming it (focus/selection); without this, first click selects row, second click runs action.
        actionElements.push(
          <Tooltip key={action.id} title={label || action.id || ''}>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', width: 'auto' }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <CustomGridActionsCellItem {...actionProps} />
            </span>
          </Tooltip>
        );
      });

      // Return actions (or null if no actions match)
      return actionElements.length > 0 ? actionElements : null;
    },
  };
  
  return columnConfig;
}

/**
 * Hook version that supports confirmation dialogs and loading states
 * Use this when you need confirmation dialogs or complex state management
 * 
 * @param {Array} actions - Array of action configuration objects
 * @param {object} options - Optional column configuration
 * @returns {object} - DataGrid actions column configuration with state management
 */
export function useActionsColumn(actions = [], options = {}) {
  const [confirmState, setConfirmState] = useState({
    open: false,
    action: null,
    row: null,
    params: null,
  });

  const handleConfirm = useCallback(() => {
    setConfirmState((prevState) => {
      if (prevState.action?.onClick && prevState.row) {
        try {
          prevState.action.onClick(prevState.row, prevState.params);
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error(
              `useActionsColumn: Error in onClick handler for action '${prevState.action.id}':`,
              error
            );
          }
        }
      }
      return { open: false, action: null, row: null, params: null };
    });
  }, []);

  const handleCancel = useCallback(() => {
    setConfirmState({ open: false, action: null, row: null, params: null });
  }, []);


  const columnConfig = useMemo(() => {
    if (!Array.isArray(actions) || actions.length === 0) {
      return null;
    }

    // Create modified actions with confirmation handling
    // We need to capture handleActionClick in the closure
    const modifiedActions = actions.map((action) => {
      if (action.confirm) {
        return {
          ...action,
          onClick: (row, params) => {
            setConfirmState({ open: true, action, row, params });
          },
        };
      }
      return action;
    });

    return createActionsColumn(modifiedActions, options);
  }, [actions, options]);

  const getConfirmValue = useCallback((value, row) => {
    if (typeof value === 'function') {
      try {
        return value(row);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('useActionsColumn: Error evaluating confirm function:', error);
        }
        return null;
      }
    }
    return value;
  }, []);

  const ConfirmationDialogComponent = confirmState.open ? (
    <ConfirmationDialog
      open={confirmState.open}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={getConfirmValue(confirmState.action?.confirm?.title, confirmState.row)}
      message={getConfirmValue(confirmState.action?.confirm?.message, confirmState.row)}
      confirmText={getConfirmValue(confirmState.action?.confirm?.confirmText, confirmState.row)}
      cancelText={getConfirmValue(confirmState.action?.confirm?.cancelText, confirmState.row)}
    />
  ) : null;

  return {
    column: columnConfig,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}

