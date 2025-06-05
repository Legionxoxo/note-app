import React, { useState, useMemo } from "react";
import NoteList from "./NoteList";
import FolderManager from "./FolderManager";
import SearchBar from "./SearchBar";

const Sidebar = ({
    notes,
    folders,
    onNoteSelect,
    onFolderSelect,
    onCreateNote,
    onCreateFolder,
    onDeleteNote,
    onDeleteFolder,
    onUpdateFolder,
    onUpdateNote,
    selectedNoteId,
    selectedFolderId,
    getChildFolders,
    getRootFolders,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const { titleMatches, tagMatches } = useMemo(() => {
        if (!searchQuery) return { titleMatches: [], tagMatches: [] };

        const query = searchQuery.toLowerCase();
        const titleMatches = notes.filter((note) =>
            note.title.toLowerCase().includes(query)
        );
        const tagMatches = notes.filter((note) =>
            note.tags?.some((tag) => tag.toLowerCase().includes(query))
        );

        return { titleMatches, tagMatches };
    }, [notes, searchQuery]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query) {
            setIsSearching(true);
        }
    };

    const handleToggleSearch = () => {
        setIsSearching(!isSearching);
        if (!isSearching) {
            setSearchQuery("");
        }
    };

    const handleCloseSearch = () => {
        setIsSearching(false);
        setSearchQuery("");
    };

    const rootNotes = notes.filter((note) => !note.folderId);

    return (
        <div className="w-[300px] h-full bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    My Notes
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => onCreateNote(selectedFolderId || null)}
                        className="flex-1 py-2 px-3 bg-blue-600 text-white rounded flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                        📝 New Note
                    </button>
                    <button
                        onClick={() => onCreateFolder(selectedFolderId || null)}
                        className="flex-1 py-2 px-3 bg-gray-600 text-white rounded flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                    >
                        📁 New Folder
                    </button>
                    <button
                        onClick={handleToggleSearch}
                        className="py-2 px-3 bg-gray-600 text-white rounded flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                    >
                        🔍
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {isSearching && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Search Notes
                            </h3>
                            <button
                                onClick={handleCloseSearch}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                title="Close Search"
                            >
                                ✕
                            </button>
                        </div>
                        <SearchBar
                            onSearch={handleSearch}
                            onToggleSearch={handleToggleSearch}
                        />
                    </div>
                )}

                {isSearching ? (
                    <div className="space-y-6">
                        {titleMatches.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    Matched by Title
                                </h3>
                                <NoteList
                                    notes={titleMatches}
                                    onNoteSelect={onNoteSelect}
                                    onDeleteNote={onDeleteNote}
                                    selectedNoteId={selectedNoteId}
                                />
                            </div>
                        )}
                        {tagMatches.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    Matched by Tags
                                </h3>
                                <NoteList
                                    notes={tagMatches}
                                    onNoteSelect={onNoteSelect}
                                    onDeleteNote={onDeleteNote}
                                    selectedNoteId={selectedNoteId}
                                />
                            </div>
                        )}
                        {titleMatches.length === 0 &&
                            tagMatches.length === 0 && (
                                <p className="text-gray-500 text-center py-4">
                                    No matches found
                                </p>
                            )}
                    </div>
                ) : (
                    <>
                        {/* Root level notes */}
                        {rootNotes.length > 0 && (
                            <div className="mb-5">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    Root Notes
                                </h3>
                                <NoteList
                                    notes={rootNotes}
                                    onNoteSelect={onNoteSelect}
                                    onDeleteNote={onDeleteNote}
                                    selectedNoteId={selectedNoteId}
                                />
                            </div>
                        )}

                        {/* Folders */}
                        <FolderManager
                            folders={folders}
                            onFolderSelect={onFolderSelect}
                            selectedFolderId={selectedFolderId}
                            getChildFolders={getChildFolders}
                            getRootFolders={getRootFolders}
                            notes={notes}
                            onNoteSelect={onNoteSelect}
                            onDeleteNote={onDeleteNote}
                            selectedNoteId={selectedNoteId}
                            onUpdateFolder={onUpdateFolder}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
