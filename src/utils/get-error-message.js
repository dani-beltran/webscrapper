const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export function getErrorMessage(error) {
  try {
    if (
      error !== null &&
      (typeof error === 'object' || typeof error === 'function') &&
      typeof error.message === 'string'
    ) {
      return error.message || UNKNOWN_ERROR_MESSAGE;
    }

    if (error === null || error === undefined) {
      return UNKNOWN_ERROR_MESSAGE;
    }

    return String(error) || UNKNOWN_ERROR_MESSAGE;
  } catch {
    return UNKNOWN_ERROR_MESSAGE;
  }
}
