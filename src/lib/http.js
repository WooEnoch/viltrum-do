export function jsonError(error, fallback = 'Something went wrong.') {
  const status = error?.name === 'ZodError' ? 400 : Number.isInteger(error?.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  const message = error?.name === 'ZodError' ? 'Please check the information provided.' : status >= 500 ? fallback : error.message;
  return Response.json({ error: message }, { status });
}

export function appError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}
