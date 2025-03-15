/**
 * Type definition for backend API error response
 */
interface ApiErrorResponse {
    error: string;
    message: string;
}

/**
 * Type guard to check if an object is an ApiErrorResponse
 */
function isApiErrorResponse(obj: any): obj is ApiErrorResponse {
    return obj && typeof obj.message === 'string' && typeof obj.error === 'string';
}

/**
 * Extract error message from error object returned by API calls
 */
export const extractErrorMessage = (err: unknown, defaultMessage: string): string => {
    if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response
    ) {
        const responseData = err.response.data;

        if (isApiErrorResponse(responseData)) {
            return responseData.message;
        }

        if (typeof responseData === 'object' && responseData !== null && 'message' in responseData) {
            return String(responseData.message);
        }

        if (typeof responseData === 'string') {
            return responseData;
        }
    }

    if (err instanceof Error) {
        return err.message;
    }

    return defaultMessage;
}; 