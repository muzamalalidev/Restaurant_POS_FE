import { useCallback } from 'react';

import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

/**
 * Generic CustomDialog Component
 *
 * A production-ready dialog component with comprehensive edge case handling:
 * - Configurable close icon
 * - Backdrop click behavior control
 * - Escape key handling
 * - Focus management
 * - Loading/disabled states
 * - Accessibility features
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback when dialog should close (event, reason)
 * @param {string|ReactNode} props.title - Dialog title
 * @param {ReactNode} props.children - Dialog content
 * @param {ReactNode} props.actions - Action buttons (rendered in DialogActions)
 * @param {boolean} props.showCloseIcon - Show close icon in title (default: true)
 * @param {boolean} props.closeOnBackdropClick - Close on backdrop click (default: true)
 * @param {boolean} props.closeOnEscapeKey - Close on Escape key (default: true)
 * @param {boolean} props.disableClose - Disable all close mechanisms (default: false)
 * @param {boolean} props.loading - Loading state (blocks close) (default: false)
 * @param {string|false} props.maxWidth - Dialog max width: 'xs'|'sm'|'md'|'lg'|'xl'|false
 * @param {boolean} props.fullWidth - Full width dialog (default: true)
 * @param {boolean} props.fullScreen - Full screen dialog (default: false)
 * @param {boolean} props.dividers - Show dividers in DialogContent (default: false)
 * @param {Function} props.onCloseIconClick - Custom close icon click handler
 * @param {string} props.closeIconPosition - Close icon position: 'left'|'right' (default: 'right')
 * @param {ReactNode} props.closeIcon - Custom close icon component
 * @param {boolean} props.disableAutoFocus - Disable auto focus (default: false)
 * @param {boolean} props.disableEnforceFocus - Disable focus enforcement (default: false)
 * @param {boolean} props.disableRestoreFocus - Disable focus restoration (default: false)
 * @param {boolean} props.keepMounted - Keep dialog mounted when closed (default: false)
 * @param {number|Object} props.transitionDuration - Transition duration
 */
export function CustomDialog({
  open,
  onClose,
  title,
  children,
  actions,
  showCloseIcon = true,
  closeOnBackdropClick = true,
  closeOnEscapeKey = true,
  disableClose = false,
  loading = false,
  maxWidth = 'sm',
  fullWidth = true,
  fullScreen = false,
  dividers = false,
  onCloseIconClick,
  closeIconPosition = 'right',
  closeIcon,
  disableAutoFocus = false,
  disableEnforceFocus = false,
  disableRestoreFocus = false,
  keepMounted = false,
  transitionDuration,
  ...other
}) {
  // Determine if close should be disabled
  const isCloseDisabled = disableClose || loading;

  // Handle close with reason
  const handleClose = useCallback(
    (event, reason) => {
      // Prevent close if disabled or loading
      if (isCloseDisabled) {
        return;
      }

      // Check backdrop click
      if (reason === 'backdropClick' && !closeOnBackdropClick) {
        return;
      }

      // Check escape key
      if (reason === 'escapeKeyDown' && !closeOnEscapeKey) {
        return;
      }

      // Call onClose with event and reason
      if (onClose) {
        onClose(event, reason);
      }
    },
    [isCloseDisabled, closeOnBackdropClick, closeOnEscapeKey, onClose]
  );

  // Handle close icon click
  const handleCloseIconClick = useCallback(
    (event) => {
      if (isCloseDisabled) {
        return;
      }

      // Call custom handler if provided
      if (onCloseIconClick) {
        onCloseIconClick(event);
        return;
      }

      // Default: close with reason
      handleClose(event, 'closeIconClick');
    },
    [isCloseDisabled, onCloseIconClick, handleClose]
  );

  // Determine if escape key should be disabled
  const shouldDisableEscapeKey = isCloseDisabled || !closeOnEscapeKey;

  // Render close icon
  const renderCloseIcon = () => {
    if (!showCloseIcon) {
      return null;
    }

    const defaultIcon = <Iconify icon="mingcute:close-line" />;
    const iconToRender = closeIcon || defaultIcon;

    return (
      <IconButton
        aria-label="Close dialog"
        onClick={handleCloseIconClick}
        disabled={isCloseDisabled}
        sx={{
          position: 'absolute',
          top: (theme) => theme.spacing(1.5),
          [closeIconPosition]: (theme) => theme.spacing(1.5),
          zIndex: 1,
        }}
      >
        {iconToRender}
      </IconButton>
    );
  };

  // Render title with close icon
  const renderTitle = () => {
    if (!title && !showCloseIcon) {
      return null;
    }

    // If no title but close icon is shown, render empty title with close icon
    if (!title && showCloseIcon) {
      return (
        <DialogTitle
          sx={{
            pb: 0,
            pr: closeIconPosition === 'right' ? 6 : undefined,
            pl: closeIconPosition === 'left' ? 6 : undefined,
            position: 'relative',
            minHeight: 48,
          }}
        >
          {renderCloseIcon()}
        </DialogTitle>
      );
    }

    // Title with optional close icon
    return (
      <DialogTitle
        sx={{
          pb: 2,
          pr: showCloseIcon && closeIconPosition === 'right' ? 6 : undefined,
          pl: showCloseIcon && closeIconPosition === 'left' ? 6 : undefined,
          position: 'relative',
        }}
      >
        {title}
        {renderCloseIcon()}
      </DialogTitle>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      disableEscapeKeyDown={shouldDisableEscapeKey}
      disableAutoFocus={disableAutoFocus}
      disableEnforceFocus={disableEnforceFocus}
      disableRestoreFocus={disableRestoreFocus}
      keepMounted={keepMounted}
      transitionDuration={transitionDuration}
      {...other}
    >
      {renderTitle()}

      {children && (
        <DialogContent dividers={dividers} sx={{ typography: 'body2' }}>
          {children}
        </DialogContent>
      )}

      {actions && <DialogActions>{actions}</DialogActions>}
    </Dialog>
  );
}

