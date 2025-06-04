import React, { useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import { EDITOR_JS_TOOLS } from "./editor/editorTools";
import { handleFileUpload } from "../utils/fileUtils";
import { exportAsMarkdown, downloadMarkdown } from "../utils/exportUtils";

const Editor = ({ note, onSave }) => {
    const editorRef = useRef(null);
    const editorInstance = useRef(null);
    const fileInputRef = useRef(null);
    const [title, setTitle] = useState(note?.title || "Untitled Note");

    const saveNote = async () => {
        try {
            if (!editorInstance.current) {
                throw new Error("Editor instance not initialized");
            }

            const outputData = await editorInstance.current.save();
            onSave({
                id: note?.id || Date.now().toString(),
                title,
                content: outputData,
                lastModified: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Error saving note:", error);
            alert("Error saving note. Please try again.");
        }
    };

    const handleExport = async () => {
        try {
            const markdownContent = await exportAsMarkdown(
                editorInstance.current,
                title
            );
            downloadMarkdown(markdownContent, title);
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

            // Clear and reinitialize editor with new content
            if (editorInstance.current) {
                await editorInstance.current.destroy();
                editorInstance.current = null;
            }

            // Create new editor instance with parsed content
            editorInstance.current = new EditorJS({
                holder: editorRef.current,
                tools: EDITOR_JS_TOOLS,
                placeholder: "Start writing your note here...",
                data: {
                    blocks: blocks,
                },
                onChange: async () => {
                    try {
                        setTimeout(async () => {
                            try {
                                const outputData =
                                    await editorInstance.current.save();
                                onSave({
                                    id: note?.id || Date.now().toString(),
                                    title,
                                    content: outputData,
                                    lastModified: new Date().toISOString(),
                                });
                            } catch (saveError) {
                                console.error("Auto-save error:", saveError);
                            }
                        }, 300);
                    } catch (error) {
                        console.error("Error in onChange:", error);
                    }
                },
                onReady: () => {
                    console.log("Editor.js is ready to work!");
                },
            });
        } catch (error) {
            console.error("Error handling file:", error);
            alert(
                error.message ||
                    "Error reading the markdown file. Please try again."
            );
        }

        // Reset file input
        event.target.value = "";
    };

    const initializeEditor = async () => {
        if (editorInstance.current) {
            try {
                if (typeof editorInstance.current.destroy === "function") {
                    await editorInstance.current.destroy();
                }
            } catch (error) {
                console.error("Error destroying editor:", error);
            }
            editorInstance.current = null;
        }

        try {
            editorInstance.current = new EditorJS({
                holder: editorRef.current,
                tools: EDITOR_JS_TOOLS,
                placeholder: "Start writing your note here...",
                data: note?.content || undefined,
                onChange: async () => {
                    try {
                        setTimeout(async () => {
                            try {
                                const outputData =
                                    await editorInstance.current.save();
                                onSave({
                                    id: note?.id || Date.now().toString(),
                                    title,
                                    content: outputData,
                                    lastModified: new Date().toISOString(),
                                });
                            } catch (saveError) {
                                console.error("Auto-save error:", saveError);
                            }
                        }, 300);
                    } catch (error) {
                        console.error("Error in onChange:", error);
                    }
                },
                onReady: () => {
                    console.log("Editor.js is ready to work!");
                },
            });
        } catch (error) {
            console.error("Error initializing editor:", error);
            alert("Error initializing editor. Please refresh the page.");
        }
    };

    useEffect(() => {
        initializeEditor();
        setTitle(note?.title || "Untitled Note");

        return () => {
            if (editorInstance.current) {
                try {
                    if (typeof editorInstance.current.destroy === "function") {
                        editorInstance.current.destroy();
                    }
                } catch (error) {
                    console.error("Error destroying editor:", error);
                }
                editorInstance.current = null;
            }
        };
    }, [note?.id]);

    return (
        <div
            className="editor-container"
            style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
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
                    style={{
                        flex: 1,
                        padding: "8px 12px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "16px",
                        fontWeight: "500",
                    }}
                    placeholder="Note Title"
                />
                <div
                    className="editor-buttons"
                    style={{ display: "flex", gap: "8px" }}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".md"
                        style={{ display: "none" }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 12px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        Upload MD
                    </button>
                    <button
                        onClick={saveNote}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 12px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                        </svg>
                        Save Note
                    </button>
                    <button
                        onClick={handleExport}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "8px 12px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        Export MD
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
                    borderRight: "1px solid #e9ecef",
                    borderBottom: "1px solid #e9ecef",
                }}
            />
        </div>
    );
};
export default Editor;
