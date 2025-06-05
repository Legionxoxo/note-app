import { useState, useEffect } from "react";

const useFolderManager = () => {
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);

    useEffect(() => {
        // Load folders from localStorage on initial render
        const savedFolders = localStorage.getItem("folders");
        if (savedFolders) {
            try {
                const parsedFolders = JSON.parse(savedFolders);
                setFolders(parsedFolders);
            } catch (error) {
                console.error(
                    "Error loading folders from localStorage:",
                    error
                );
                setFolders([]);
            }
        }
    }, []);

    const handleCreateFolder = (parentId = null) => {
        const newFolder = {
            id: Date.now().toString(),
            name: "New Folder",
            createdAt: new Date().toISOString(),
            isEditing: true,
            parentId: parentId,
        };
        const updatedFolders = [...folders, newFolder];
        setFolders(updatedFolders);
        setSelectedFolderId(newFolder.id);
        localStorage.setItem("folders", JSON.stringify(updatedFolders));
    };

    const handleDeleteFolder = (folderId) => {
        // Get all child folders recursively
        const getChildFolderIds = (parentId) => {
            const children = folders.filter((f) => f.parentId === parentId);
            return children.reduce((acc, child) => {
                return [...acc, child.id, ...getChildFolderIds(child.id)];
            }, []);
        };

        const childFolderIds = getChildFolderIds(folderId);
        const foldersToDelete = [folderId, ...childFolderIds];

        // Remove the folder and all its children
        const updatedFolders = folders.filter(
            (folder) => !foldersToDelete.includes(folder.id)
        );
        setFolders(updatedFolders);
        localStorage.setItem("folders", JSON.stringify(updatedFolders));

        if (
            selectedFolderId === folderId ||
            foldersToDelete.includes(selectedFolderId)
        ) {
            setSelectedFolderId(null);
        }
    };

    const handleUpdateFolder = (folderId, newName) => {
        const updatedFolders = folders.map((folder) =>
            folder.id === folderId
                ? { ...folder, name: newName, isEditing: false }
                : folder
        );
        setFolders(updatedFolders);
        localStorage.setItem("folders", JSON.stringify(updatedFolders));
    };

    const handleFolderSelect = (folderId) => {
        setSelectedFolderId(folderId);
    };

    // Helper function to get child folders
    const getChildFolders = (parentId) => {
        return folders.filter((folder) => folder.parentId === parentId);
    };

    // Helper function to get root folders (folders without parents)
    const getRootFolders = () => {
        return folders.filter((folder) => !folder.parentId);
    };

    return {
        folders,
        selectedFolderId,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleFolderSelect,
        getChildFolders,
        getRootFolders,
    };
};

export default useFolderManager;
