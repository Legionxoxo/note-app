import React from "react";
import NoteList from "./NoteList";
import CreateNoteButton from "./CreateNoteButton";

const Sidebar = ({ notes, onNoteSelect, onCreateNote, onDownloadNote }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>My Notes</h2>
                <CreateNoteButton onCreateNote={onCreateNote} />
            </div>
            <NoteList
                notes={notes}
                onNoteSelect={onNoteSelect}
                onDownloadNote={onDownloadNote}
            />
        </div>
    );
};

export default Sidebar;
