import React, { useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import { EDITOR_JS_TOOLS } from "./editor/editorTools";
import { handleFileUpload } from "../utils/fileUtils";
import { exportAsMarkdown, downloadMarkdown } from "../utils/exportUtils";

const Editor = ({ note = {}, onSave, onClose, onUpdateNote, onUpdateTags }) => {
    const editorRef = useRef(null);
    const editorInstance = useRef(null);
    const fileInputRef = useRef(null);
    const initializationLock = useRef(false);
    const currentNoteId = useRef(null);
    const debounceTimeoutRef = useRef(null);

    const [title, setTitle] = useState(note.title || "Untitled Note");
    const [tags, setTags] = useState(note.tags || ["#untitled"]);
    const [tagInput, setTagInput] = useState("");
    const titleRef = useRef(title);

    useEffect(() => {
        setTitle(note.title || "Untitled Note");
        setTags(note.tags || ["#untitled"]);
    }, [note.title, note.tags]);

    useEffect(() => {
        titleRef.current = title;
    }, [title]);

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        onUpdateNote(note.id, newTitle);
    };

    const handleTagInputChange = (e) => {
        setTagInput(e.target.value);
    };

    const handleTagInputKeyDown = (e) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (!newTag.startsWith("#")) {
                setTagInput("#" + newTag);
                return;
            }
            if (!tags.includes(newTag)) {
                const newTags = [...tags, newTag];
                setTags(newTags);
                onUpdateTags(note.id, newTags);
            }
            setTagInput("");
        } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
            const newTags = tags.slice(0, -1);
            setTags(newTags);
            onUpdateTags(note.id, newTags);
        }
    };

    const removeTag = (tagToRemove) => {
        const newTags = tags.filter((tag) => tag !== tagToRemove);
        setTags(newTags);
        onUpdateTags(note.id, newTags);
    };

    const forceDestroyEditor = () => {
        if (editorInstance.current) {
            try {
                if (typeof editorInstance.current.destroy === "function") {
                    editorInstance.current.destroy();
                }
                if (typeof editorInstance.current.clear === "function") {
                    editorInstance.current.clear();
                }
            } catch (error) {
                console.warn("Error during editor cleanup:", error);
            }
            editorInstance.current = null;
        }
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
    };

    const initializeEditor = async (customData = null) => {
        if (initializationLock.current) {
            console.log(
                "Editor initialization already in progress, skipping..."
            );
            return;
        }

        initializationLock.current = true;
        console.log("Initializing editor for note:", note.id);

        try {
            forceDestroyEditor();
            await new Promise((resolve) => setTimeout(resolve, 200));
            if (editorRef.current) {
                editorRef.current.innerHTML = "";
            }

            const editorData = customData || note.content || { blocks: [] };

            editorInstance.current = new EditorJS({
                holder: editorRef.current,
                tools: EDITOR_JS_TOOLS,
                placeholder: "Start writing your note here...",
                data: editorData,
                onChange: () => {
                    if (debounceTimeoutRef.current) {
                        clearTimeout(debounceTimeoutRef.current);
                    }

                    debounceTimeoutRef.current = setTimeout(async () => {
                        try {
                            if (
                                editorInstance.current &&
                                !initializationLock.current
                            ) {
                                const outputData =
                                    await editorInstance.current.save();
                                onSave({
                                    id: note.id || Date.now().toString(),
                                    title: titleRef.current,
                                    content: outputData,
                                    lastModified: new Date().toISOString(),
                                });
                            }
                        } catch (error) {
                            console.error("Auto-save error:", error);
                        }
                    }, 800);
                },
                onReady: () => {
                    console.log("Editor.js is ready!");
                    currentNoteId.current = note.id;
                    initializationLock.current = false;
                },
            });
        } catch (error) {
            console.error("Error initializing editor:", error);
            initializationLock.current = false;
            alert("Error initializing editor. Please refresh the page.");
        }
    };

    useEffect(() => {
        if (currentNoteId.current !== note.id) {
            console.log(
                "Note ID changed:",
                currentNoteId.current,
                "→",
                note.id
            );
            initializeEditor();
        }

        return () => {
            console.log("Unmounting editor, cleaning up...");
            initializationLock.current = false;
            currentNoteId.current = null;
            forceDestroyEditor();
        };
    }, [note.id]);

    const saveNote = async () => {
        try {
            if (!editorInstance.current)
                throw new Error("Editor not initialized");

            const outputData = await editorInstance.current.save();
            onSave({
                id: note.id || Date.now().toString(),
                title: titleRef.current,
                content: outputData,
                lastModified: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error saving note manually:", error);
            alert("Error saving note. Please try again.");
        }
    };

    const handleExport = async () => {
        try {
            const markdownContent = await exportAsMarkdown(
                editorInstance.current,
                titleRef.current
            );
            downloadMarkdown(markdownContent, titleRef.current);
        } catch (error) {
            console.error("Error exporting note:", error);
            alert("Error exporting note. Please try again.");
        }
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const blocks = await handleFileUpload(file, onSave, setTitle);
            currentNoteId.current = null;
            await initializeEditor({ blocks });
        } catch (error) {
            console.error("File upload error:", error);
            alert(
                error.message ||
                    "Error reading the markdown file. Please try again."
            );
        }

        event.target.value = "";
    };

    return (
        <div className="w-[96%] h-full flex flex-col p-5 mb-10 font-sans">
            <div className="flex flex-col gap-3 mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Note Title"
                    className="px-3 py-2 border border-gray-300 rounded text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex flex-wrap gap-2 items-center">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                            {tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Add tag (press Enter)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".md"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                        📂 Upload MD
                    </button>
                    <button
                        onClick={saveNote}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                        💾 Save Note
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                        ⬇️ Export MD
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                        title="Close Editor"
                    >
                        ✕ Close
                    </button>
                </div>
            </div>

            <div
                ref={editorRef}
                className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-lg p-2.5 bg-white"
            />
        </div>
    );
};

export default Editor;
