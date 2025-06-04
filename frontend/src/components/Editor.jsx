import React, { useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import { EDITOR_JS_TOOLS } from "./editor/editorTools";
import { handleFileUpload } from "../utils/fileUtils";
import { exportAsMarkdown, downloadMarkdown } from "../utils/exportUtils";

const Editor = ({ note = {}, onSave }) => {
    const editorRef = useRef(null);
    const editorInstance = useRef(null);
    const fileInputRef = useRef(null);
    const initializationLock = useRef(false);
    const currentNoteId = useRef(null);
    const debounceTimeoutRef = useRef(null);

    const [title, setTitle] = useState(note.title || "Untitled Note");
    const titleRef = useRef(title);

    useEffect(() => {
        setTitle(note.title || "Untitled Note");
    }, [note.title]);

    useEffect(() => {
        titleRef.current = title;
    }, [title]);

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
        <div
            className="editor-container"
            style={{
                fontFamily: "system-ui",
                width: "96%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                padding: "20px",
                marginBottom: "40px",
            }}
        >
            <div
                className="editor-header"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                    padding: "16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    border: "1px solid #e9ecef",
                }}
            >
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={saveNote}
                    placeholder="Note Title"
                    style={{
                        flex: 1,
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "16px",
                        fontWeight: "500",
                    }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".md"
                        style={{ display: "none" }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={buttonStyle("#6c757d")}
                    >
                        📂 Upload MD
                    </button>
                    <button onClick={saveNote} style={buttonStyle("#007bff")}>
                        💾 Save Note
                    </button>
                    <button
                        onClick={handleExport}
                        style={buttonStyle("#28a745")}
                    >
                        ⬇️ Export MD
                    </button>
                </div>
            </div>

            <div
                ref={editorRef}
                className="editor"
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    padding: "10px",
                    backgroundColor: "white",
                }}
            />
        </div>
    );
};

const buttonStyle = (bgColor) => ({
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: bgColor,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
});

export default Editor;
