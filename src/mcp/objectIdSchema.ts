import * as z from 'zod/v4';

export const objectId = z.string().regex(/^[0-9a-f]{24}$/i, 'Must be a 24-hex-digit ObjectId');
