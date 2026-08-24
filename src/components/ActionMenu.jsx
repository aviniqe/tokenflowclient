import { useState } from 'react';
import { HiOutlineEllipsisHorizontal } from 'react-icons/hi2';
import Modal from './Modal.jsx';

export default function ActionMenu({ options = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-ghost" type="button" onClick={() => setOpen(true)}>
        <HiOutlineEllipsisHorizontal /> Actions
      </button>
      <Modal
        open={open}
        title="Actions"
        subtitle="Choose what you want to do next"
        onClose={() => setOpen(false)}
      >
        <div className="action-list">
          {options.map((option) => (
            <button
              key={option.label}
              className={`action-item${option.danger ? ' danger' : ''}`}
              type="button"
              onClick={() => {
                setOpen(false);
                option.onClick();
              }}
            >
              <span className="action-item-icon">{option.icon}</span>
              <span>
                <strong>{option.label}</strong>
                {option.hint ? <small>{option.hint}</small> : null}
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
