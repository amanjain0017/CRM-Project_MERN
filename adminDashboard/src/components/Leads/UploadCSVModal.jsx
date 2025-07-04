import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  uploadLeadsCSV,
  clearUploadStatus,
} from "../../redux/slices/leadSlice";
import "./UploadCSVModalStyle.css";

const UploadCSVModal = ({
  isOpen,
  onClose,
  uploadStatus, // 'idle', 'pending', 'success', 'failed'
  uploadMessage,
  uploadErrors,
}) => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState(null); // elected file object
  const [isDragOver, setIsDragOver] = useState(false); // drag-and-drop visual feedback
  const [localMessage, setLocalMessage] = useState(null); // immediate user feedback (file type error)
  const [messageType, setMessageType] = useState(null); // 'error', 'info'

  const fileInputRef = useRef(null); // hidden file input

  // clear selected file and local messages when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setLocalMessage(null);
      setMessageType(null);
    }
  }, [isOpen]);

  // Handle file selection via browse button or drag-and-drop
  const handleFileChange = (files) => {
    setLocalMessage(null);
    setMessageType(null);

    if (files && files[0]) {
      const file = files[0];
      // check file type
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null); // Clear invalid file
        setLocalMessage("Please upload a valid CSV file (.csv).");
        setMessageType("error");
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault(); // Prevent default to allow drop
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileChange(e.dataTransfer.files);
  };

  // Handle upload button click
  const handleUpload = async () => {
    if (!selectedFile) {
      setLocalMessage("Please select a CSV file to upload.");
      setMessageType("error");
      return;
    }

    setLocalMessage(null); // Clear any local messages before dispatching
    setMessageType(null);

    // Read file content as text
    const reader = new FileReader();

    reader.onload = async (e) => {
      const csvContent = e.target.result;
      try {
        await dispatch(uploadLeadsCSV(csvContent)).unwrap();
      } catch (error) {
        console.error("Failed to upload CSV:", error);
      }
    };
    reader.readAsText(selectedFile); // Read the file as text
  };

  // close modal when uploadStatus becomes 'success'
  useEffect(() => {
    if (uploadStatus === "success") {
      // delay to allow user to see success message briefly before modal closes
      const timer = setTimeout(() => {
        dispatch(clearUploadStatus());
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="csv-upload-modal-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2 className="modal-title">CSV Upload</h2>
        <p className="modal-subtitle">Add your documents here</p>

        <div
          className={`drop-area ${isDragOver ? "drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files)}
            accept=".csv"
            style={{ display: "none" }}
          />
          <div className="folder-icon"></div>{" "}
          <p>Drag your file(s) to start uploading</p>
          <p className="or-separator">OR</p>
          <button type="button" className="browse-files-button">
            Browse files
          </button>
        </div>

        {selectedFile && (
          <div className="selected-file-display">
            <span>{selectedFile.name}</span>
          </div>
        )}

        {/* Local messages (file validation errors) */}
        {localMessage && (
          <p
            className={`upload-status-message ${
              messageType === "error" ? "failed" : "info"
            }`}
          >
            {localMessage}
          </p>
        )}

        {/* Display Redux upload status/messages */}
        {uploadStatus === "pending" && (
          <p className="upload-status-message pending">Uploading...</p>
        )}
        {uploadStatus === "success" && (
          <p className="upload-status-message success">{uploadMessage}</p>
        )}
        {uploadStatus === "failed" && (
          <div className="upload-status-message failed">
            <p>{uploadMessage}</p>
            {uploadErrors && uploadErrors.length > 0 && (
              <ul>
                {uploadErrors.map((err, index) => (
                  <li key={index}>{err.message || err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            className="next-button"
            disabled={!selectedFile || uploadStatus === "pending"}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadCSVModal;
