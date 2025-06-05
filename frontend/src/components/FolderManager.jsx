import React, { useState, useEffect } from "react";
import NoteList from "./NoteList";

const FolderItem = ({
    folder,
    level = 0,
    onFolderSelect,
    selectedFolderId,
    getChildFolders,
    notes,
    onNoteSelect,
    onDeleteNote,
    selectedNoteId,
    onUpdateFolder,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(folder.name);

    useEffect(() => {
        setEditName(folder.name);
    }, [folder.name]);

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleNameSave = () => {
        if (editName.trim()) {
            onUpdateFolder(folder.id, editName.trim());
        }
        setIsEditing(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleNameSave();
        } else if (e.key === "Escape") {
            setIsEditing(false);
            setEditName(folder.name);
        }
    };

    const childFolders = getChildFolders(folder.id);
    const folderNotes = notes.filter((note) => note.folderId === folder.id);

    return (
        <div className="mb-1">
            <div
                className={`flex items-center p-1.5 rounded cursor-pointer transition-colors border border-gray-200 ${
                    selectedFolderId === folder.id
                        ? "bg-gray-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
                style={{ marginLeft: `${level * 20}px` }}
                onClick={() => onFolderSelect(folder.id)}
            >
                <div className="w-full">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:bg-gray-300 hover:text-gray-800 rounded text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                            >
                                {(childFolders.length > 0 ||
                                    folderNotes.length > 0) &&
                                    (isExpanded ? "▼" : "▶")}
                            </button>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    onBlur={handleNameSave}
                                    onKeyDown={handleKeyPress}
                                    className="w-full px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            ) : (
                                <span
                                    className="truncate"
                                    onDoubleClick={handleDoubleClick}
                                >
                                    📁 {folder.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-1">
                    {/* Show notes first */}
                    {folderNotes.length > 0 && (
                        <div
                            className="mb-2"
                            style={{ marginLeft: `${(level + 1) * 20}px` }}
                        >
                            <NoteList
                                notes={folderNotes}
                                onNoteSelect={onNoteSelect}
                                onDeleteNote={onDeleteNote}
                                selectedNoteId={selectedNoteId}
                            />
                        </div>
                    )}
                    {/* Then show subfolders */}
                    {childFolders.length > 0 && (
                        <div className="mt-1">
                            {childFolders.map((childFolder) => (
                                <FolderItem
                                    key={childFolder.id}
                                    folder={childFolder}
                                    level={level + 1}
                                    onFolderSelect={onFolderSelect}
                                    selectedFolderId={selectedFolderId}
                                    getChildFolders={getChildFolders}
                                    notes={notes}
                                    onNoteSelect={onNoteSelect}
                                    onDeleteNote={onDeleteNote}
                                    selectedNoteId={selectedNoteId}
                                    onUpdateFolder={onUpdateFolder}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const FolderManager = ({
    folders,
    onFolderSelect,
    selectedFolderId,
    getChildFolders,
    getRootFolders,
    notes,
    onNoteSelect,
    onDeleteNote,
    selectedNoteId,
    onUpdateFolder,
}) => {
    const rootFolders = getRootFolders();

    return (
        <div className="p-2.5">
            {rootFolders.map((folder) => (
                <FolderItem
                    key={folder.id}
                    folder={folder}
                    onFolderSelect={onFolderSelect}
                    selectedFolderId={selectedFolderId}
                    getChildFolders={getChildFolders}
                    notes={notes}
                    onNoteSelect={onNoteSelect}
                    onDeleteNote={onDeleteNote}
                    selectedNoteId={selectedNoteId}
                    onUpdateFolder={onUpdateFolder}
                />
            ))}
        </div>
    );
};

export default FolderManager;
