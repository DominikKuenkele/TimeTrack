export type PageItem = number | 'ellipsis';

/**
 * Pages to show as buttons: a window of maxButtons pages around the current one,
 * plus the first and last page, with an ellipsis where at least one page is skipped.
 */
export const getPageRange = (currentPage: number, totalPages: number, maxButtons = 5): PageItem[] => {
    const items: PageItem[] = [];

    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
        items.push(1);

        if (startPage > 2) {
            items.push('ellipsis');
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        items.push(i);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            items.push('ellipsis');
        }

        items.push(totalPages);
    }

    return items;
};
