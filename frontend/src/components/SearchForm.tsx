import React from 'react';
import './SearchForm.css';

interface SearchFormProps {
    searchTerm: string;
    setSearchTerm: (searchTerm: string) => void
}

const SearchForm: React.FC<SearchFormProps> = React.memo(({ searchTerm, setSearchTerm }) => {
    return (
        <div className="search-form">
            <input
                type="text"
                placeholder="Search Project..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
            />
        </div>
    );
});

export default SearchForm; 