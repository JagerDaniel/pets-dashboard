// Site is paused for development. Remove this block to resume normal
// access (the US-only geo check below it still applies once resumed).
const PAUSED = false;

export async function onRequest({ request, next }) {
  if (PAUSED) {
    return new Response(
      'This site is temporarily offline for maintenance. Please check back soon.',
      { status: 503, headers: { 'content-type': 'text/plain' } }
    );
  }

  const country = request.cf?.country;

  if (country && country !== 'US') {
    return new Response(
      'This site is only available to visitors in the United States.',
      { status: 403, headers: { 'content-type': 'text/plain' } }
    );
  }

  return next();
}
