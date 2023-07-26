export const GRAPHCACHE_PROVIDERS = [
  { name: 'Official', url: 'https://ambindexer.net/gcgo/' }
]


export class GraphcacheProvider {
  constructor(provider) {
    this.provider = provider;
  }

  async user_balance_tokens(address, chainId) {
    const url = new URL(this.provider.url);

    url.pathname += 'user_balance_tokens'
    url.searchParams.append("user", address);
    url.searchParams.append("chainId", chainId);

    return (await this.sendRequest(url));
  }

  async user_positions(address, chainId) {
    const url = new URL(this.provider.url);

    url.pathname += 'user_positions'
    url.searchParams.append("user", address);
    url.searchParams.append("chainId", chainId);
    url.searchParams.append("omitEmpty", true);

    return (await this.sendRequest(url));
  }

  async sendRequest(url, full = false) {
    const req = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        //"Content-Type": "application/json",
      },
    }).catch();

    const resp = await req.json();
    // console.log("sendRequest resp", resp);

    if (resp.error) {
      throw resp.error;
    }
    if (full) {
      return resp;
    } else {
      return resp.data;
    }
  }
}
