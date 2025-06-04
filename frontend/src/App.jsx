import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import "./App.css";

const App = () => {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [currentNote, setCurrentNote] = useState(null);

    useEffect(() => {
        // Load notes from localStorage on initial render
        const savedNotes = localStorage.getItem("notes");
        if (savedNotes) {
            try {
                const parsedNotes = JSON.parse(savedNotes);
                setNotes(parsedNotes);
            } catch (error) {
                console.error("Error loading notes from localStorage:", error);
                setNotes([]);
            }
        }
    }, []);

    const handleNoteSelect = (note) => {
        // Find the latest version of the note from our state
        const currentNote = notes.find((n) => n.id === note.id) || note;
        setSelectedNote(currentNote);
    };

    const handleCreateNote = () => {
        const newNote = {
            id: Date.now().toString(),
            title: "Untitled Note",
            content: {
                blocks: [
                    {
                        type: "paragraph",
                        data: {
                            text: "Start writing your note here...",
                        },
                    },
                ],
            },
            lastModified: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        setSelectedNote(newNote);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
    };

    const handleDeleteNote = (noteId) => {
        const updatedNotes = notes.filter((note) => note.id !== noteId);
        setNotes(updatedNotes);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));

        // If the deleted note was selected, clear the selection
        if (selectedNote && selectedNote.id === noteId) {
            setSelectedNote(null);
        }
    };

    const handleSave = (noteData) => {
        setCurrentNote(noteData);
        // Update the note in the notes array
        const updatedNotes = notes.map((note) =>
            note.id === noteData.id ? noteData : note
        );
        setNotes(updatedNotes);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
        console.log("Note saved:", noteData);
    };

    const handleDownloadNote = (note) => {
        if (!note.content) {
            alert("No content to download");
            return;
        }

        // Convert note content to markdown format
        let markdown = `# ${note.title}\n\n`;
        note.content.blocks.forEach((block) => {
            switch (block.type) {
                case "paragraph":
                    markdown += `${block.data.text}\n\n`;
                    break;
                case "header":
                    markdown += `${"#".repeat(block.data.level)} ${
                        block.data.text
                    }\n\n`;
                    break;
                // Add other block type conversions as needed
            }
        });

        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${note.title || "untitled"}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                onDownloadNote={handleDownloadNote}
            />
            <main
                className="main-content"
                style={{
                    flex: 1,
                    overflow: "hidden",
                }}
            >
                {selectedNote ? (
                    <Editor
                        key={selectedNote.id}
                        note={currentNote}
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
