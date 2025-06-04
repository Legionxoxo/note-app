import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import "./App.css";

const App = () => {
    const [notes, setNotes] = useState([]);
    const [selectedNoteId, setSelectedNoteId] = useState(null);

    // Get the selected note from the notes array
    const selectedNote =
        notes.find((note) => note.id === selectedNoteId) || null;

    useEffect(() => {
        // Load notes from localStorage on initial render
        const savedNotes = localStorage.getItem("notes");
        if (savedNotes) {
            try {
                const parsedNotes = JSON.parse(savedNotes);
                setNotes(parsedNotes);
                if (parsedNotes.length > 0) {
                    setSelectedNoteId(parsedNotes[0].id); // auto-select first note
                }
            } catch (error) {
                console.error("Error loading notes from localStorage:", error);
                setNotes([]);
            }
        }
    }, []);

    const handleNoteSelect = (note) => {
        setSelectedNoteId(note.id);
    };

    const handleCreateNote = () => {
        const newNote = {
            id: Date.now().toString(),
            title: "Untitled Note",
            content: {
                blocks: [
                    {
                        type: "paragraph",
                        data: { text: "" }, // empty content for new note
                    },
                ],
            },
            lastModified: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        setSelectedNoteId(newNote.id);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
    };

    const handleDeleteNote = (noteId) => {
        const updatedNotes = notes.filter((note) => note.id !== noteId);
        setNotes(updatedNotes);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));

        if (selectedNoteId === noteId) {
            // Select another note or clear selection if none left
            setSelectedNoteId(
                updatedNotes.length > 0 ? updatedNotes[0].id : null
            );
        }
    };

    const handleSave = (updatedNote) => {
        // Update lastModified when saving
        const noteToSave = {
            ...updatedNote,
            lastModified: new Date().toISOString(),
        };

        // Update notes array - this will automatically update selectedNote
        // since it's derived from the notes array
        const updatedNotes = notes.map((note) =>
            note.id === noteToSave.id ? noteToSave : note
        );
        setNotes(updatedNotes);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
        console.log("Note saved:", noteToSave);
    };

    return (
        <div
            className="app"
            style={{ display: "flex", height: "100vh", overflow: "hidden" }}
        >
            <Sidebar
                notes={notes}
                onNoteSelect={handleNoteSelect}
                onCreateNote={handleCreateNote}
                onDeleteNote={handleDeleteNote}
                selectedNoteId={selectedNoteId}
            />
            <main
                className="main-content"
                style={{ flex: 1, overflow: "hidden" }}
            >
                {selectedNote ? (
                    <Editor
                        key={selectedNoteId}
                        note={selectedNote}
                        onSave={handleSave}
                    />
                ) : (
                    <div className="welcome-screen">
                        <h1>Welcome to Notes App</h1>
                        <p>Select a note or create a new one to get started</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
