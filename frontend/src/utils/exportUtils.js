export const exportAsMarkdown = async (editorInstance, title) => {
    try {
        if (!editorInstance) {
            throw new Error("Editor instance not initialized");
        }

        const outputData = await editorInstance.save();
        let markdownContent = "";

        if (title && title !== "Untitled Note") {
            markdownContent += `# ${title}\n\n`;
        }

        outputData.blocks.forEach((block) => {
            switch (block.type) {
                case "header":
                    const headerLevel = "#".repeat(block.data.level);
                    const headerText = block.data.text.replace(/<[^>]*>/g, "");
                    markdownContent += `${headerLevel} ${headerText}\n\n`;
                    break;

                case "paragraph":
                    let paragraphText = block.data.text;
                    // Convert HTML formatting back to markdown
                    paragraphText = paragraphText.replace(
                        /<mark[^>]*>(.*?)<\/mark>/gi,
                        "==$1=="
                    );
                    paragraphText = paragraphText.replace(
                        /<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi,
                        "**$2**"
                    );
                    paragraphText = paragraphText.replace(
                        /<(em|i)[^>]*>(.*?)<\/(em|i)>/gi,
                        "*$2*"
                    );
                    paragraphText = paragraphText.replace(/<[^>]*>/g, "");
                    markdownContent += `${paragraphText}\n\n`;
                    break;

                case "list":
                    block.data.items.forEach((item, index) => {
                        const listMarker =
                            block.data.style === "ordered"
                                ? `${index + 1}.`
                                : "-";
                        // Handle both string items and object items with text property
                        const itemText =
                            typeof item === "string"
                                ? item.replace(/<[^>]*>/g, "")
                                : (item.text || "").replace(/<[^>]*>/g, "");
                        markdownContent += `${listMarker} ${itemText}\n`;
                    });
                    markdownContent += "\n";
                    break;

                case "checklist":
                    block.data.items.forEach((item) => {
                        const checkmark = item.checked ? "[x]" : "[ ]";
                        const itemText = (item.text || "").replace(
                            /<[^>]*>/g,
                            ""
                        );
                        markdownContent += `- ${checkmark} ${itemText}\n`;
                    });
                    markdownContent += "\n";
                    break;

                case "table":
                    if (block.data.content && block.data.content.length > 0) {
                        // Table rows
                        block.data.content.forEach((row, rowIndex) => {
                            markdownContent += `| ${row.join(" | ")} |\n`;

                            // Add separator after header row
                            if (rowIndex === 0 && block.data.withHeadings) {
                                const separator =
                                    "| " +
                                    row.map(() => "---").join(" | ") +
                                    " |";
                                markdownContent += `${separator}\n`;
                            }
                        });
                        markdownContent += "\n";
                    }
                    break;

                case "code":
                    markdownContent += `\`\`\`\n${block.data.code}\n\`\`\`\n\n`;
                    break;

                case "image":
                    const altText = block.data.caption || "";
                    let imageUrl = block.data.url;

                    // Handle data URLs
                    if (imageUrl.startsWith("data:image")) {
                        // Extract file extension from the data URL
                        const extension = imageUrl.split(";")[0].split("/")[1];
                        // Generate a filename based on the current timestamp
                        const filename = `image_${Date.now()}.${extension}`;
                        imageUrl = filename;
                    }

                    markdownContent += `![${altText}](${imageUrl})\n\n`;
                    break;

                case "delimiter":
                    markdownContent += "---\n\n";
                    break;

                default:
                    // Handle any other block types as plain text
                    if (block.data.text) {
                        const plainText = block.data.text.replace(
                            /<[^>]*>/g,
                            ""
                        );
                        if (plainText.trim()) {
                            markdownContent += `${plainText}\n\n`;
                        }
                    }
            }
        });

        return markdownContent;
    } catch (error) {
        console.error("Error exporting note as Markdown:", error);
        throw error;
    }
};

export const downloadMarkdown = (markdown, title) => {
    if (!markdown.trim()) {
        throw new Error(
            "Generated markdown is empty. Please check your note content."
        );
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
};
