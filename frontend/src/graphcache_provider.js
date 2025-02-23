export const GRAPHCACHE_PROVIDERS = [
  // { name: "bus's indexer", url: 'https://ambindexer.bus.bz/gcgo/' }, // it's like >2M RPC requests per day wtf
  { name: 'Official', urls: {
    1: 'https://ambindexer.net/gcgo/',
    5: 'https://ambindexer.net/gcgo/',
    1923: 'https://ambindexer.net/swell-gcgo/',
    7700: 'https://ambient.plexnode.wtf/gcgo/',
    10143: 'https://ambindexer.net/gcgo-testnet/',
    42161: 'https://ambindexer.net/gcgo/',
    81457: 'https://ambindexer.net/blast-gcgo/',
    98865: 'https://ambindexer.net/plume-gcgo/',
    421613: 'https://ambindexer.net/scroll-gcgo/',
    534351: 'https://ambindexer.net/gcgo/',
    534352: 'https://ambindexer.net/scroll-gcgo/',
    11155111: 'https://ambindexer.net/gcgo-testnet/',
    168587773: 'https://ambindexer.net/gcgo-testnet/'} }
]


export class GraphcacheProvider {
  constructor() {
    this.selected_provider_index = 0
  }

  async user_balance_tokens(address, chainId) {
    const req = `user_balance_tokens?user=${address}&chainId=${chainId}`
    return (await this.sendRequest(req, chainId));
  }

  async user_positions(address, chainId) {
    const req = `user_positions?user=${address}&chainId=${chainId}&omitEmpty=true`
    return (await this.sendRequest(req, chainId));
  }

  async sendRequest(req, chainId, full = false) {
    let err = null
    for (const i in GRAPHCACHE_PROVIDERS) {
      const provider = GRAPHCACHE_PROVIDERS[this.selected_provider_index]
      const chainUrl = provider.urls[parseInt(chainId)]
      const url = new URL(chainUrl + req);

      const abort = new AbortController()
      const timeout = setTimeout(() => abort.abort(), 5000)
      try {
        const req = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            // "Content-Type": "application/json",
          },
          signal: abort.signal,
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
      } catch (e) {
        err = e
        console.error('graphcache fetch error', e)
        this.selected_provider_index = (this.selected_provider_index + 1) % GRAPHCACHE_PROVIDERS.length
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
    console.error('ran out of providers, throwing')
    throw err
  }
}
