import React, { useState } from 'react';
import { getPageRange } from '../utils/paginationUtils';
import './Pagination.css';


interface PaginationProps {
    currentPage: number
    setCurrentPage: (currentPage: number) => void
    perPage: number
    setPerPage: (perPage: number) => void
    totalPages: number
    totalProjects: number
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalPages,
    totalProjects
}) => {
    const [perPageInput, setPerPageInput] = useState<string>(perPage.toString());

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage);
            window.scrollTo(0, 0);
        }
    };

    const handlePerPageChange = (newPerPage: number) => {
        if (newPerPage !== perPage) {
            setPerPage(newPerPage);
            setCurrentPage(1);
            window.scrollTo(0, 0);
        }
    };

    const handlePerPageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setPerPageInput(value);

        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue > 0) {
            handlePerPageChange(numValue);
        }
    };

    const handlePerPageInputBlur = () => {
        if (!perPageInput || parseInt(perPageInput, 10) <= 0) {
            setPerPageInput(perPage.toString());
        }
    };

    const renderPageNumbers = () => {
        return getPageRange(currentPage, totalPages).map((page, index) => {
            if (page === 'ellipsis') {
                return <span key={`ellipsis${index}`} className="pagination-ellipsis">...</span>;
            }

            return (
                <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`pagination-page-button ${page === currentPage ? 'active' : ''}`}
                >
                    {page}
                </button>
            );
        });
    };


    return totalPages > 0 && (
        <div className="pagination-container">
            <div className="pagination">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-button"
                >
                    Previous
                </button>

                <div className="pagination-numbers">
                    {renderPageNumbers()}
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-button"
                >
                    Next
                </button>
            </div>

            <div className="pagination-info">
                Page {currentPage} of {totalPages} -
                ({totalProjects} {totalProjects === 1 ? 'project' : 'projects'})
            </div>

            <div className="per-page-selector">
                <label htmlFor="per-page">Projects per page:</label>
                <input
                    type="text"
                    id="per-page"
                    value={perPageInput}
                    onChange={handlePerPageInputChange}
                    onBlur={handlePerPageInputBlur}
                    className="per-page-input"
                    placeholder="Enter number"
                />
            </div>
        </div>
    )
};

export default Pagination; 