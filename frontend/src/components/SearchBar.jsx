import React, { useState } from "react";

const SearchBar = ({ onSearch, onToggleSearch }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch(query);
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search notes..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
                onClick={onToggleSearch}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
                🔍 Search
            </button>
        </div>
    );
};

export default SearchBar;
