const GOERLI_CHAIN = {
  addrs: {
    dex: "0xfafcd1f5530827e7398b6d3c509f450b1b24a209",
    query: "0xc9900777baa5EE94Cd2C6509fb09278A1A46b7e8",
    impact: "0x142BE02F2A3A27ecD6e2f18a43c2C234F372C831"
  },
  poolIndex: 36000,
  isTestNet: true,
  chainId: "0x5",
  gridSize: 64,
  proxyPaths: {
    cold: 0,
    long: 4,
    liq: 2
  },
  blockExplorer: "https://goerli.etherscan.io/",
  usdc: "0xd87ba7a50b2e7e660f678a895e4b72e7cb4ccd9c",
};

const ARB_GOERLI_CHAIN = {
  addrs: {
    dex: "0x5D42d6046927DEE12b9b4a235be0ceCd55D0E0fb",
    query: "0x3A6E9cff691a473D4D0742E1dFc8Ea263a99F6d0",
    impact: "0xf19D3dcdF82af0d40Cb3b4AaE4D266c638A3E454"
  },
  poolIndex: 36000,
  isTestNet: true,
  chainId: "0x66eed",
  gridSize: 16,
  proxyPaths: {
    cold: 3,
    long: 4,
    liq: 2
  },
  blockExplorer: "https://goerli.arbiscan.io/",
};

const MAINNET_CHAIN = {
  addrs: {
    dex: "0xAaAaAAAaA24eEeb8d57D431224f73832bC34f688",
    query: "0xc2e1f740E11294C64adE66f69a1271C5B32004c8",
    impact: "0x3e3EDd3eD7621891E574E5d7f47b1f30A994c0D0"
  },
  poolIndex: 420,
  isTestNet: false,
  chainId: "0x1",
  gridSize: 16,
  proxyPaths: {
    cold: 3,
    long: 4,
    liq: 2
  },
  blockExplorer: "https://etherscan.io/",
};

const SCROLL_CHAIN = {
  addrs: {
    dex: "0xaaaaAAAACB71BF2C8CaE522EA5fa455571A74106",
    query: "0x62223e90605845cf5cc6dae6e0de4cda130d6ddf",
    impact: "0xc2c301759b5e0c385a38e678014868a33e2f3ae3"
  },
  withdrawCallpath: 3,
  depositCallpath: 3,
  depositPermitCallpath: 3,
  poolIndex: 420,
  isTestNet: false,
  chainId: 534352,
  gridSize: 16,
  proxyPaths: {
    cold: 3,
    long: 130,
    liq: 128
  },
  blockExplorer: "https://scrollscan.com/",
  geckoChainString: "scroll"
}

const SCROLL_SEPOLIA_CHAIN = {
  addrs: {
    dex: "0xaaAAAaa6612bd88cD409cb0D70C99556C87A0E8c",
    query: "0x43eC1302FE3587862e15B2D52AD9653575FD79e9",
    impact: "0x9B28970D51A231741416D8D3e5281d9c51a50892"
  },
  poolIndex: 36000,
  chainId: 534351,
  gridSize: 1,
  proxyPaths: {
    cold: 3,
    long: 130,
    liq: 128
  },
  blockExplorer: "https://sepolia.scrollscan.dev/",
}

export const CROC_CHAINS = {
  1: MAINNET_CHAIN,
  5: GOERLI_CHAIN,
  421613: ARB_GOERLI_CHAIN,
  534351: SCROLL_SEPOLIA_CHAIN,
  534352: SCROLL_CHAIN,
}
