function assetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const directResponse = await env.ASSETS.fetch(request);

    if (directResponse.status !== 404 || request.method !== "GET") {
      return directResponse;
    }

    const pathname = url.pathname.endsWith("/")
      ? `${url.pathname}index.html`
      : `${url.pathname}/index.html`;
    return env.ASSETS.fetch(assetRequest(request, pathname));
  }
};
