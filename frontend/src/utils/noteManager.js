// Note and Folder Management Utilities

// Note Management
export const createNote = (folderId = null) => {
    return {
        id: Date.now().toString(),
        title: "Untitled Note",
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
};

export const saveNote = (note, notes) => {
    const noteToSave = {
        ...note,
        lastModified: new Date().toISOString(),
    };

    return notes.map((n) =>
        n.id === noteToSave.id ? { ...noteToSave, folderId: n.folderId } : n
    );
};

export const deleteNote = (noteId, notes) => {
    return notes.filter((note) => note.id !== noteId);
};

export const getNotesForFolder = (folderId, notes) => {
    return notes.filter((note) => note.folderId === folderId);
};

export const getRootNotes = (notes) => {
    return notes.filter((note) => !note.folderId);
};

// Folder Management
export const createFolder = () => {
    return {
        id: Date.now().toString(),
        name: "New Folder",
        createdAt: new Date().toISOString(),
        isEditing: true,
    };
};

export const updateFolder = (folderId, newName, folders) => {
    return folders.map((folder) =>
        folder.id === folderId
            ? { ...folder, name: newName, isEditing: false }
            : folder
    );
};

export const deleteFolder = (folderId, folders, notes) => {
    const updatedFolders = folders.filter((folder) => folder.id !== folderId);
    const updatedNotes = notes.filter((note) => note.folderId !== folderId);
    return { updatedFolders, updatedNotes };
};

// Local Storage Management
export const saveToLocalStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
    }
};

export const loadFromLocalStorage = (key) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        return null;
    }
};
