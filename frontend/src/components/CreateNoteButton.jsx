import React from "react";

const CreateNoteButton = ({ onCreateNote }) => {
    return (
        <button className="create-note-btn" onClick={onCreateNote}>
            + New Note
        </button>
    );
};

export default CreateNoteButton;
