import React from "react";

const NoteList = ({ notes, onNoteSelect, onDeleteNote }) => {
    return (
        <div className="note-list">
            {notes.map((note) => (
                <div key={note.id} className="note-item">
                    <div
                        className="note-header"
                        onClick={() => onNoteSelect(note)}
                    >
                        <h3>{note.title || "Untitled Note"}</h3>
                        <button
                            className="delete-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (
                                    window.confirm(
                                        "Are you sure you want to delete this note?"
                                    )
                                ) {
                                    onDeleteNote(note.id);
                                }
                            }}
                            title="Delete Note"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                        </button>
                    </div>
                    <p className="note-date">
                        Created:{" "}
                        {new Date(note.lastModified).toLocaleDateString()}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default NoteList;
