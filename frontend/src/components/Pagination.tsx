import React, { useState } from 'react';
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
        const pageNumbers: React.ReactNode[] = [];
        const maxPageButtons = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        if (endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(
                <button
                    key="1"
                    onClick={() => handlePageChange(1)}
                    className={`pagination-page-button ${1 === currentPage ? 'active' : ''}`}
                >
                    1
                </button>
            );

            if (startPage > 2) {
                pageNumbers.push(
                    <span key="ellipsis1" className="pagination-ellipsis">...</span>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`pagination-page-button ${i === currentPage ? 'active' : ''}`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push(
                    <span key="ellipsis2" className="pagination-ellipsis">...</span>
                );
            }

            pageNumbers.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className={`pagination-page-button ${totalPages === currentPage ? 'active' : ''}`}
                >
                    {totalPages}
                </button>
            );
        }

        return pageNumbers;
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