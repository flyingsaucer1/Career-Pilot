export const MAX_UPLOAD_MB = import.meta.env.PROD ? 4 : 5;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
