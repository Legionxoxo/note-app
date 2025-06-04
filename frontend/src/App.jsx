import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import "./App.css";

function App() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);

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
            markdown: "",
            lastModified: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        setSelectedNote(newNote);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
    };

    const handleSaveNote = (updatedNote) => {
        setNotes((prevNotes) => {
            const updatedNotes = prevNotes.map((note) =>
                note.id === updatedNote.id ? updatedNote : note
            );
            localStorage.setItem("notes", JSON.stringify(updatedNotes));
            return updatedNotes;
        });
    };

    const handleDownloadNote = (note) => {
        if (!note.markdown) {
            alert("No content to download");
            return;
        }

        const blob = new Blob([note.markdown], { type: "text/markdown" });
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
        <div className="app">
            <Sidebar
                notes={notes}
                onNoteSelect={handleNoteSelect}
                onCreateNote={handleCreateNote}
                onDownloadNote={handleDownloadNote}
            />
            <main className="main-content">
                {selectedNote ? (
                    <Editor
                        key={selectedNote.id}
                        note={selectedNote}
                        onSave={handleSaveNote}
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
}

export default App;
