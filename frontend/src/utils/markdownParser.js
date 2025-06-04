export const parseMarkdownToEditorJS = (markdown) => {
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
                        currentListType === "ordered" ? "ordered" : "unordered",
                    items: currentListItems,
                },
            });
            currentListItems = [];
            currentListType = null;
        }
    };

    const processInlineFormatting = (text) => {
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

        // Delimiter (horizontal rule)
        if (line === "---" || line === "***" || line === "___") {
            flushList();
            blocks.push({
                type: "delimiter",
                data: {},
            });
        }
        // Code blocks
        else if (line.startsWith("```")) {
            flushList();
            const language = line.replace("```", "").trim();
            let codeContent = "";
            i++; // Move to next line

            while (i < lines.length && !lines[i].trim().startsWith("```")) {
                codeContent += (codeContent ? "\n" : "") + lines[i];
                i++;
            }

            blocks.push({
                type: "code",
                data: {
                    code: codeContent,
                },
            });
        }
        // Tables
        else if (line.includes("|") && line.split("|").length > 2) {
            flushList();
            const tableRows = [];
            let j = i;

            // Parse table rows
            while (j < lines.length && lines[j].includes("|")) {
                const row = lines[j]
                    .split("|")
                    .map((cell) => cell.trim())
                    .filter((cell) => cell);
                if (row.length > 0) {
                    tableRows.push(row);
                }
                j++;

                // Skip separator row (e.g., |---|---|)
                if (
                    j < lines.length &&
                    lines[j].match(/^\s*\|?[\s\-\|:]+\|?\s*$/)
                ) {
                    j++;
                }
            }

            if (tableRows.length > 0) {
                const maxCols = Math.max(...tableRows.map((row) => row.length));
                const normalizedRows = tableRows.map((row) => {
                    while (row.length < maxCols) {
                        row.push("");
                    }
                    return row;
                });

                blocks.push({
                    type: "table",
                    data: {
                        withHeadings: true,
                        content: normalizedRows,
                    },
                });
            }

            i = j - 1;
        }
        // Images
        else if (line.match(/!\[.*?\]\(.*?\)/)) {
            flushList();
            const match = line.match(/!\[(.*?)\]\((.*?)\)/);
            if (match) {
                blocks.push({
                    type: "image",
                    data: {
                        url: match[2],
                        caption: match[1] || "",
                    },
                });
            }
        }
        // Headers
        else if (line.startsWith("#")) {
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
                const nextMatch = nextLine.match(/^[-*+]\s*\[([ x])\]\s*(.*)/i);
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
        // Unordered list items
        else if (
            line.match(/^[-*+]\s/) &&
            !line.match(/^[-*+]\s*\[([ x])\]/i)
        ) {
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
                !lines[j].trim().match(/^[-*+]\s*\[([ x])\]/i) &&
                !lines[j].trim().startsWith("```") &&
                !(lines[j].includes("|") && lines[j].split("|").length > 2) &&
                !lines[j].match(/!\[.*?\]\(.*?\)/) &&
                lines[j] !== "---" &&
                lines[j] !== "***" &&
                lines[j] !== "___"
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
