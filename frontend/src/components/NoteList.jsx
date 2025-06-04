import React from "react";

const NoteList = ({ notes, onNoteSelect, onDownloadNote }) => {
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
                            className="download-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownloadNote(note);
                            }}
                            title="Download as Markdown"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                            </svg>
                        </button>
                    </div>
                    <div
                        className="note-preview"
                        onClick={() => onNoteSelect(note)}
                    >
                        {note.markdown ? (
                            <div className="markdown-preview">
                                {note.markdown
                                    .split("\n")
                                    .slice(0, 3)
                                    .map((line, index) => (
                                        <p key={index} className="preview-line">
                                            {line.length > 50
                                                ? line.substring(0, 50) + "..."
                                                : line}
                                        </p>
                                    ))}
                            </div>
                        ) : (
                            <p className="preview-line">No content</p>
                        )}
                    </div>
                    <p className="note-date">
                        {new Date(note.lastModified).toLocaleDateString()}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default NoteList;
