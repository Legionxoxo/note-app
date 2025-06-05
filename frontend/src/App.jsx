import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import useFolderManager from "./hooks/useFolderManager";
import "./App.css";

const App = () => {
    const [notes, setNotes] = useState([]);
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const {
        folders,
        selectedFolderId,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleFolderSelect: originalHandleFolderSelect,
        getChildFolders,
        getRootFolders,
    } = useFolderManager();

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
                    setSelectedNoteId(parsedNotes[0].id);
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

    const handleCreateNote = (folderId = null) => {
        const newNote = {
            id: Date.now().toString(),
            title: "Untitled Note",
            tags: ["#untitled"],
            content: {
                blocks: [
                    {
                        type: "paragraph",
                        data: { text: "" },
                    },
                ],
            },
            folderId: folderId,
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
            const folderNotes = updatedNotes.filter(
                (note) => note.folderId === selectedFolderId
            );
            setSelectedNoteId(
                folderNotes.length > 0 ? folderNotes[0].id : null
            );
        }
    };

    const handleSave = (updatedNote) => {
        const noteToSave = {
            ...updatedNote,
            lastModified: new Date().toISOString(),
        };

        const updatedNotes = notes.map((note) =>
            note.id === noteToSave.id
                ? {
                      ...noteToSave,
                      folderId: note.folderId,
                      tags: note.tags || ["#untitled"],
                  }
                : note
        );
        setNotes(updatedNotes);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
    };

    const handleUpdateNote = (noteId, newTitle) => {
        const updatedNotes = notes.map((note) =>
            note.id === noteId
                ? {
                      ...note,
                      title: newTitle,
                      lastModified: new Date().toISOString(),
                      tags: note.tags || ["#untitled"],
                  }
                : note
        );
        setNotes(updatedNotes);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
    };

    const handleUpdateTags = (noteId, newTags) => {
        const updatedNotes = notes.map((note) =>
            note.id === noteId
                ? {
                      ...note,
                      tags: newTags,
                      lastModified: new Date().toISOString(),
                  }
                : note
        );
        setNotes(updatedNotes);
        localStorage.setItem("notes", JSON.stringify(updatedNotes));
    };

    // Custom folder selection handler that doesn't automatically select a note
    const handleFolderSelect = (folderId) => {
        originalHandleFolderSelect(folderId);
        setSelectedNoteId(null);
    };

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                notes={notes}
                folders={folders}
                onNoteSelect={handleNoteSelect}
                onFolderSelect={handleFolderSelect}
                onCreateNote={handleCreateNote}
                onCreateFolder={handleCreateFolder}
                onDeleteNote={handleDeleteNote}
                onDeleteFolder={handleDeleteFolder}
                onUpdateFolder={handleUpdateFolder}
                onUpdateNote={handleUpdateNote}
                onUpdateTags={handleUpdateTags}
                selectedNoteId={selectedNoteId}
                selectedFolderId={selectedFolderId}
                getChildFolders={getChildFolders}
                getRootFolders={getRootFolders}
            />
            <main className="flex-1 overflow-hidden">
                {selectedNote ? (
                    <Editor
                        key={selectedNoteId}
                        note={selectedNote}
                        onSave={handleSave}
                        onClose={() => setSelectedNoteId(null)}
                        onUpdateNote={handleUpdateNote}
                        onUpdateTags={handleUpdateTags}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <h1 className="text-amber-200 text-4xl font-bold mb-4">
                            Welcome to Notes App
                        </h1>
                        <p className="text-gray-600">
                            Select a note or create a new one to get started
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
