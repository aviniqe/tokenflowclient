import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';

export default function Modal({ open, title, subtitle, onClose, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className={`modal${wide ? ' wide' : ''}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="modal-head">
              <div className="modal-head-copy">
                <h2>{title}</h2>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
              <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
                <HiOutlineXMark size={18} />
              </button>
            </div>
            {children ? <div className="modal-body">{children}</div> : null}
            {footer ? <div className="modal-foot">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
