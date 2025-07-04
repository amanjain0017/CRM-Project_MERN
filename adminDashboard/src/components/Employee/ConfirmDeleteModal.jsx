import "./Modal.css";

const ConfirmDeleteModal = ({ employeeId, onClose, onDelete }) => {
  const handleDeleteClick = () => {
    onDelete(employeeId);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title delete-title">Confirm Deletion</h2>
        <p className="modal-message">
          Are you sure you want to delete this employee?
        </p>
        <p className="modal-message">
          Pending leads of employee will be redistributed.
        </p>
        <div className="modal-actions">
          <button onClick={handleDeleteClick} className="confirm-delete-button">
            Delete
          </button>
          <button onClick={onClose} className="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
