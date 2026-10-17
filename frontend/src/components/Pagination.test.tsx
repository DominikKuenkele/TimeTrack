import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Pagination from './Pagination';

const setCurrentPage = vi.fn();
const setPerPage = vi.fn();

const renderPagination = (currentPage: number, totalPages = 10, perPage = 20) =>
    render(
        <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            perPage={perPage}
            setPerPage={setPerPage}
            totalPages={totalPages}
            totalProjects={totalPages * perPage}
        />
    );

beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn());
});

describe('Pagination', () => {
    it('goes to the clicked page', async () => {
        renderPagination(1);

        await userEvent.click(screen.getByRole('button', { name: '3' }));

        expect(setCurrentPage).toHaveBeenCalledWith(3);
    });

    it('does not reload the current page', async () => {
        renderPagination(2);

        await userEvent.click(screen.getByRole('button', { name: '2' }));

        expect(setCurrentPage).not.toHaveBeenCalled();
    });

    it('disables Previous on the first and Next on the last page', () => {
        const { unmount } = renderPagination(1);
        expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
        unmount();

        renderPagination(10);
        expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    });

    it('resets to the first page when the page size changes', async () => {
        renderPagination(4);

        const input = screen.getByLabelText('Projects per page:');
        await userEvent.clear(input);
        await userEvent.type(input, '5');

        expect(setPerPage).toHaveBeenCalledWith(5);
        expect(setCurrentPage).toHaveBeenCalledWith(1);
    });

    it('ignores non-numeric and zero page sizes', async () => {
        renderPagination(4);

        const input = screen.getByLabelText('Projects per page:');
        await userEvent.clear(input);
        await userEvent.type(input, 'a0');

        expect(setPerPage).not.toHaveBeenCalled();
    });

    it('renders nothing without pages', () => {
        const { container } = renderPagination(1, 0);

        expect(container).toBeEmptyDOMElement();
    });
});
