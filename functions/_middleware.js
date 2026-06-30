export async function onRequest({ request, next }) {
  const country = request.cf?.country;

  if (country && country !== 'US') {
    return new Response(
      'This site is only available to visitors in the United States.',
      { status: 403, headers: { 'content-type': 'text/plain' } }
    );
  }

  return next();
}
