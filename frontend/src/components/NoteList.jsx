import React from "react";

const NoteList = ({ notes, onNoteSelect, onDeleteNote, selectedNoteId }) => {
    return (
        <div className="space-y-2">
            {notes.map((note) => (
                <div
                    key={note.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedNoteId === note.id
                            ? "bg-blue-100 border border-blue-200"
                            : "hover:bg-gray-100 border border-transparent"
                    }`}
                >
                    <div
                        className="flex items-center justify-between"
                        onClick={() => onNoteSelect(note)}
                    >
                        <h3 className="text-gray-800 font-medium truncate">
                            {note.title || "Untitled Note"}
                        </h3>
                        <button
                            className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-full transition-colors"
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
                            🗑️
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                        Last modified:{" "}
                        {new Date(note.lastModified).toLocaleDateString()}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default NoteList;
