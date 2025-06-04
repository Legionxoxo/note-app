import React, { useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Marker from "@editorjs/marker";
import Checklist from "@editorjs/checklist";

const EDITOR_JS_TOOLS = {
    header: {
        class: Header,
        config: {
            placeholder: "Enter a header",
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 1,
        },
    },
    list: {
        class: List,
        inlineToolbar: true,
        config: {
            defaultStyle: "unordered",
        },
    },
    marker: {
        class: Marker,
        shortcut: "CMD+SHIFT+M",
    },
    checklist: {
        class: Checklist,
        inlineToolbar: true,
    },
};

const Editor = ({ note, onSave }) => {
    const editorRef = useRef(null);
    const editorInstance = useRef(null);
    const fileInputRef = useRef(null);
    const [title, setTitle] = useState(note?.title || "Untitled Note");

    const parseMarkdownToEditorJS = (markdown) => {
        const lines = markdown.split("\n");
        const blocks = [];
        let currentListItems = [];
        let currentListType = null;
        let i = 0;

        const flushList = () => {
            if (currentListItems.length > 0) {
                blocks.push({
                    type: "list",
                    data: {
                        style:
                            currentListType === "ordered"
                                ? "ordered"
                                : "unordered",
                        items: currentListItems,
                    },
                });
                currentListItems = [];
                currentListType = null;
            }
        };

        const processInlineFormatting = (text) => {
            // Convert markdown formatting to HTML for Editor.js
            return text
                .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // Bold
                .replace(/\*(.*?)\*/g, "<i>$1</i>") // Italic
                .replace(/==(.*?)==/g, "<mark>$1</mark>"); // Highlight
        };

        while (i < lines.length) {
            let line = lines[i].trim();

            // Skip empty lines
            if (!line) {
                flushList();
                i++;
                continue;
            }

            // Headers
            if (line.startsWith("#")) {
                flushList();
                const level = line.match(/^#+/)[0].length;
                const text = line.replace(/^#+\s*/, "");
                if (text) {
                    blocks.push({
                        type: "header",
                        data: {
                            text: processInlineFormatting(text),
                            level: Math.min(level, 6),
                        },
                    });
                }
            }
            // Unordered list items
            else if (line.match(/^[-*+]\s/)) {
                const text = line.replace(/^[-*+]\s/, "");
                if (currentListType !== "unordered") {
                    flushList();
                    currentListType = "unordered";
                }
                currentListItems.push(processInlineFormatting(text));
            }
            // Ordered list items
            else if (line.match(/^\d+\.\s/)) {
                const text = line.replace(/^\d+\.\s/, "");
                if (currentListType !== "ordered") {
                    flushList();
                    currentListType = "ordered";
                }
                currentListItems.push(processInlineFormatting(text));
            }
            // Checklist items
            else if (line.match(/^[-*+]\s*\[([ x])\]/i)) {
                flushList();
                const match = line.match(/^[-*+]\s*\[([ x])\]\s*(.*)/i);
                const checked = match[1].toLowerCase() === "x";
                const text = match[2];

                // Look ahead for more checklist items
                const checklistItems = [
                    {
                        text: processInlineFormatting(text),
                        checked: checked,
                    },
                ];

                let j = i + 1;
                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    const nextMatch = nextLine.match(
                        /^[-*+]\s*\[([ x])\]\s*(.*)/i
                    );
                    if (nextMatch) {
                        checklistItems.push({
                            text: processInlineFormatting(nextMatch[2]),
                            checked: nextMatch[1].toLowerCase() === "x",
                        });
                        j++;
                    } else if (nextLine === "") {
                        j++;
                    } else {
                        break;
                    }
                }

                blocks.push({
                    type: "checklist",
                    data: {
                        items: checklistItems,
                    },
                });

                i = j - 1;
            }
            // Regular paragraph
            else {
                flushList();
                // Collect multi-line paragraphs
                let paragraphText = line;
                let j = i + 1;

                while (
                    j < lines.length &&
                    lines[j].trim() !== "" &&
                    !lines[j].trim().startsWith("#") &&
                    !lines[j].trim().match(/^[-*+]\s/) &&
                    !lines[j].trim().match(/^\d+\.\s/) &&
                    !lines[j].trim().match(/^[-*+]\s*\[([ x])\]/i)
                ) {
                    paragraphText += " " + lines[j].trim();
                    j++;
                }

                if (paragraphText) {
                    blocks.push({
                        type: "paragraph",
                        data: {
                            text: processInlineFormatting(paragraphText),
                        },
                    });
                }

                i = j - 1;
            }

            i++;
        }

        flushList();
        return blocks;
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".md")) {
            alert("Please select a .md (Markdown) file");
            return;
        }

        try {
            const text = await file.text();

            // Extract title from first line if it's a header, otherwise use filename
            const lines = text.split("\n");
            let extractedTitle = file.name.replace(".md", "");
            let content = text;

            if (lines[0] && lines[0].startsWith("# ")) {
                extractedTitle = lines[0].replace("# ", "").trim();
                content = lines.slice(1).join("\n");
            }

            setTitle(extractedTitle);

            // Parse markdown to Editor.js format
            const blocks = parseMarkdownToEditorJS(content);

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
                onChange: async (api, event) => {
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

            // Auto-save the imported content
            setTimeout(() => {
                onSave({
                    id: note?.id || Date.now().toString(),
                    title: extractedTitle,
                    content: { blocks: blocks },
                    lastModified: new Date().toISOString(),
                });
            }, 500);
        } catch (error) {
            console.error("Error reading file:", error);
            alert("Error reading the markdown file. Please try again.");
        }

        // Reset file input
        event.target.value = "";
    };

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

    const exportAsMarkdown = async () => {
        try {
            if (!editorInstance.current) {
                throw new Error("Editor instance not initialized");
            }

            const editorElement = editorRef.current;
            let markdownContent = "";

            if (title && title !== "Untitled Note") {
                markdownContent += `# ${title}\n\n`;
            }

            const blocks = editorElement.querySelectorAll(".ce-block__content");

            blocks.forEach((block) => {
                const blockElement = block.children[0];

                if (!blockElement) return;

                if (blockElement.tagName === "H1") {
                    markdownContent += `# ${blockElement.textContent}\n\n`;
                } else if (blockElement.tagName === "H2") {
                    markdownContent += `## ${blockElement.textContent}\n\n`;
                } else if (blockElement.tagName === "H3") {
                    markdownContent += `### ${blockElement.textContent}\n\n`;
                } else if (blockElement.tagName === "H4") {
                    markdownContent += `#### ${blockElement.textContent}\n\n`;
                } else if (blockElement.tagName === "H5") {
                    markdownContent += `##### ${blockElement.textContent}\n\n`;
                } else if (blockElement.tagName === "H6") {
                    markdownContent += `###### ${blockElement.textContent}\n\n`;
                } else if (blockElement.tagName === "UL") {
                    const listItems = blockElement.querySelectorAll("li");
                    listItems.forEach((item) => {
                        markdownContent += `- ${item.textContent}\n`;
                    });
                    markdownContent += "\n";
                } else if (blockElement.tagName === "OL") {
                    const listItems = blockElement.querySelectorAll("li");
                    listItems.forEach((item, index) => {
                        markdownContent += `${index + 1}. ${
                            item.textContent
                        }\n`;
                    });
                    markdownContent += "\n";
                } else if (blockElement.classList.contains("cdx-checklist")) {
                    const checklistItems = blockElement.querySelectorAll(
                        ".cdx-checklist__item"
                    );
                    checklistItems.forEach((item) => {
                        const checkbox = item.querySelector(
                            ".cdx-checklist__item-checkbox"
                        );
                        const text = item.querySelector(
                            ".cdx-checklist__item-text"
                        );
                        const isChecked = checkbox && checkbox.checked;
                        const checkmark = isChecked ? "[x]" : "[ ]";
                        markdownContent += `- ${checkmark} ${
                            text ? text.textContent : ""
                        }\n`;
                    });
                    markdownContent += "\n";
                } else {
                    const textContent =
                        blockElement.textContent || blockElement.innerText;
                    if (textContent && textContent.trim()) {
                        let processedText = blockElement.innerHTML;

                        processedText = processedText.replace(
                            /<mark[^>]*>(.*?)<\/mark>/gi,
                            "==$1=="
                        );
                        processedText = processedText.replace(
                            /<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi,
                            "**$2**"
                        );
                        processedText = processedText.replace(
                            /<(em|i)[^>]*>(.*?)<\/(em|i)>/gi,
                            "*$2*"
                        );
                        processedText = processedText.replace(/<[^>]*>/g, "");

                        const tempDiv = document.createElement("div");
                        tempDiv.innerHTML = processedText;
                        processedText =
                            tempDiv.textContent || tempDiv.innerText;

                        if (processedText.trim()) {
                            markdownContent += `${processedText}\n\n`;
                        }
                    }
                }
            });

            if (
                !markdownContent.trim() ||
                markdownContent.trim() === `# ${title}\n\n`.trim()
            ) {
                const allText =
                    editorElement.textContent || editorElement.innerText;
                if (allText && allText.trim()) {
                    markdownContent =
                        title && title !== "Untitled Note"
                            ? `# ${title}\n\n${allText.trim()}\n`
                            : `${allText.trim()}\n`;
                } else {
                    alert(
                        "No content to export. Please add some content to your note first."
                    );
                    return;
                }
            }

            downloadMarkdown(markdownContent);
        } catch (error) {
            console.error("Error exporting note as Markdown:", error);
            alert("Error exporting note as Markdown. Please try again.");
        }
    };

    const downloadMarkdown = (markdown) => {
        if (!markdown.trim()) {
            alert(
                "Generated markdown is empty. Please check your note content."
            );
            return;
        }

        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${
            title.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "note"
        }.md`;

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("Note exported as Markdown successfully");
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
                onChange: async (api, event) => {
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
                maxWidth: "800px",
                margin: "0 auto",
                padding: "20px",
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
                        onChange={handleFileUpload}
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
                        onClick={exportAsMarkdown}
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
                    minHeight: "400px",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    padding: "20px",
                    backgroundColor: "white",
                }}
            />
        </div>
    );
};

// Demo wrapper to show the component in action
const App = () => {
    const [currentNote, setCurrentNote] = useState(null);

    const handleSave = (noteData) => {
        setCurrentNote(noteData);
        console.log("Note saved:", noteData);
    };

    return (
        <div>
            <Editor note={currentNote} onSave={handleSave} />
        </div>
    );
};

export default App;
