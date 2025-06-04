import Header from "@editorjs/header";
import List from "@editorjs/list";
import Marker from "@editorjs/marker";
import Checklist from "@editorjs/checklist";
import Table from "@editorjs/table";
import Code from "@editorjs/code";
import Delimiter from "@editorjs/delimiter";

// Custom Image Tool
class ImageTool {
    constructor({ data }) {
        this.data = data || {};
        this.wrapper = null;
    }

    render() {
        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("simple-image");

        if (this.data.url) {
            this._createImage(this.data.url, this.data.caption);
        } else {
            this._createUploadForm();
        }

        return this.wrapper;
    }

    _createImage(url, caption = "") {
        this.wrapper.innerHTML = `
            <div style="text-align: center; margin: 15px 0;">
                <img src="${url}" alt="${caption}" style="max-width: 100%; height: auto; border-radius: 4px;" />
                <input type="text" placeholder="Caption (optional)" value="${caption}" 
                       style="width: 100%; margin-top: 8px; padding: 4px; border: 1px solid #ddd; border-radius: 4px; text-align: center;"
                       onchange="this.parentElement.querySelector('img').alt = this.value" />
            </div>
        `;
    }

    _createUploadForm() {
        this.wrapper.innerHTML = `
            <div style="border: 2px dashed #ddd; padding: 20px; text-align: center; border-radius: 4px;"
                 class="image-upload-area">
                <div style="margin-bottom: 15px;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                </div>
                <p style="margin: 10px 0; color: #666;">Drag and drop an image here or</p>
                <input type="file" 
                       accept="image/*" 
                       style="display: none;" 
                       class="image-file-input" />
                <button type="button" 
                        class="upload-button"
                        style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Choose File
                </button>
                <p style="margin: 10px 0; font-size: 12px; color: #666;">Supports: JPG, PNG, GIF, WebP</p>
            </div>
        `;

        const uploadArea = this.wrapper.querySelector(".image-upload-area");
        const fileInput = this.wrapper.querySelector(".image-file-input");
        const uploadButton = this.wrapper.querySelector(".upload-button");

        // Handle file selection
        uploadButton.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (e) =>
            this._handleFileSelect(e.target.files[0])
        );

        // Handle drag and drop
        uploadArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = "#007bff";
            uploadArea.style.backgroundColor = "#f8f9fa";
        });

        uploadArea.addEventListener("dragleave", (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = "#ddd";
            uploadArea.style.backgroundColor = "transparent";
        });

        uploadArea.addEventListener("drop", (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = "#ddd";
            uploadArea.style.backgroundColor = "transparent";

            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/")) {
                this._handleFileSelect(file);
            } else {
                alert("Please drop an image file");
            }
        });
    }

    _handleFileSelect(file) {
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.data.url = e.target.result;
            this.data.caption = "";
            this._createImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    save() {
        const img = this.wrapper.querySelector("img");
        const captionInput = this.wrapper.querySelector('input[type="text"]');

        if (img) {
            return {
                url: img.src,
                caption: captionInput ? captionInput.value : "",
            };
        }

        return this.data;
    }

    static get toolbox() {
        return {
            title: "Image",
            icon: '<svg width="17" height="15" viewBox="0 0 336 276"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 66-49 32 24v26zm0 52l-43-30-49 37-84-75-77 51v18c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>',
        };
    }
}

export const EDITOR_JS_TOOLS = {
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
    table: {
        class: Table,
        inlineToolbar: true,
        config: {
            rows: 2,
            cols: 3,
        },
    },
    code: {
        class: Code,
        config: {
            placeholder: "Enter code here...",
        },
    },
    image: {
        class: ImageTool,
    },
    delimiter: {
        class: Delimiter,
    },
};
