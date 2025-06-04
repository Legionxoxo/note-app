import { parseMarkdownToEditorJS } from "./markdownParser";

export const handleFileUpload = async (file, onSave, setTitle) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".md")) {
        throw new Error("Please select a .md (Markdown) file");
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

        // Auto-save the imported content
        onSave({
            id: Date.now().toString(),
            title: extractedTitle,
            content: { blocks: blocks },
            lastModified: new Date().toISOString(),
        });

        return blocks;
    } catch (error) {
        console.error("Error reading file:", error);
        throw error;
    }
};
