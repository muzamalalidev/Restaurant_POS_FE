import Button from '@mui/material/Button';

import { CustomDialog } from './custom-dialog';

// ----------------------------------------------------------------------

/**
 * ConfirmDialog Component
 *
 * A specialized dialog for confirmation actions.
 * Built on top of CustomDialog with backward compatibility.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback when dialog should close
 * @param {string|ReactNode} props.title - Dialog title
 * @param {ReactNode} props.content - Dialog content
 * @param {ReactNode} props.action - Primary action button
 * @param {boolean} props.showCloseIcon - Show close icon (default: true)
 * @param {boolean} props.closeOnBackdropClick - Close on backdrop click (default: true)
 * @param {boolean} props.closeOnEscapeKey - Close on Escape key (default: true)
 * @param {boolean} props.disableClose - Disable all close mechanisms (default: false)
 * @param {boolean} props.loading - Loading state (default: false)
 */
export function ConfirmDialog({
  open,
  title,
  action,
  content,
  onClose,
  showCloseIcon = true,
  closeOnBackdropClick = true,
  closeOnEscapeKey = true,
  disableClose = false,
  loading = false,
  ...other
}) {
  const actions = (
    <>
      {action}

      <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading || disableClose}>
        Cancel
      </Button>
    </>
  );

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={title}
      actions={actions}
      maxWidth="xs"
      showCloseIcon={showCloseIcon}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscapeKey={closeOnEscapeKey}
      disableClose={disableClose}
      loading={loading}
      {...other}
    >
      {content}
    </CustomDialog>
  );
}
