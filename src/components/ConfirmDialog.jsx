import Modal from './Modal.jsx';

export default function ConfirmDialog({
  open,
  title,
  subtitle,
  message,
  children,
  confirmLabel = 'Confirm',
  busy = false,
  danger = false,
  wide = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle || message}
      wide={wide}
      onClose={busy ? () => {} : onClose}
      footer={(
        <div className="btn-row">
          <button className={danger ? 'btn-danger' : 'btn-primary'} type="button" onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
          <button className="btn-ghost" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
        </div>
      )}
    >
      {children}
    </Modal>
  );
}
