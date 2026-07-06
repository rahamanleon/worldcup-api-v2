'use strict';

/**
 * Send a successful JSON response.
 */
function ok(res, data, meta = {}) {
  return res.status(200).json({ success: true, data, ...meta });
}

/**
 * Send a paginated list response.
 */
function paginated(res, rows, { page, limit, total }) {
  return res.status(200).json({
    success: true,
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * Send an error response with a consistent shape.
 */
function error(res, status, message, details = null) {
  const body = { success: false, error: { status, message } };
  if (details) body.error.details = details;
  return res.status(status).json(body);
}

function notFound(res, message = 'Resource not found') {
  return error(res, 404, message);
}

function badRequest(res, message = 'Bad request', details = null) {
  return error(res, 400, message, details);
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, 401, message);
}

function serverError(res, message = 'Internal server error') {
  return error(res, 500, message);
}

module.exports = { ok, paginated, error, notFound, badRequest, unauthorized, serverError };
