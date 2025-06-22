import React from 'react';

const SaveModal = ({ show, handleClose, handleSave, setName }) => {
    if (!show) {
        return null;
    }

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close-btn" onClick={handleClose}>
                    &times;
                </span>
                <h2>Save Drawing</h2>
                <input
                    type="text"
                    placeholder="Enter drawing name"
                    onChange={(e) => setName(e.target.value)}
                />
                <button onClick={handleSave}>Save</button>
            </div>
        </div>
    );
};

export default SaveModal; 