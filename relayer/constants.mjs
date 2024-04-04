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

const CANTO_CHAIN = {
  addrs: {
    dex: "0x9290C893ce949FE13EF3355660d07dE0FB793618",
    query: "0xfDf5Ed2D354e05cF292808CF94Bd5c972D842D09",
    impact: "0x97B4957BA07914c563a58C1E6c69588f9cCfC051"
  },
  poolIndex: 36000,
  chainId: 7700,
  gridSize: 16,
  proxyPaths: {
    cold: 3,
    long: 4,
    liq: 2
  },
  blockExplorer: "https://tuber.build/",
  geckoChainString: "canto"
}

const BLAST_CHAIN = {
  nodeUrl: "https://rpc.ankr.com/blast",
  addrs: {
    dex: "0xaAaaaAAAFfe404EE9433EEf0094b6382D81fb958",
    query: "0xA3BD3bE19012De72190c885FB270beb93e36a8A7",
    impact: "0x6A699AB45ADce02891E6115b81Dfb46CAa5efDb9",
    router: "0xaab17419F062bB28CdBE82f9FC05E7C47C3F6194",
    routerBypass: "0xd83eF4d0e968A96329aC297bBf049CDdaC7E0362"
  },
  poolIndex: 420,
  chainId: "0x13e31",
  gridSize: 4,
  proxyPaths: {
    cold: 3,
    long: 130,
    liq: 128,
    dfltColdSwap: true
  },
  blockExplorer: "https://blastscan.io/",
  geckoChainString: "blast"
};

const BLAST_SEPOLIA_CHAIN = {
  nodeUrl: "https://sepolia.blast.io",
  addrs: {
    dex: "0xf65976C7f25b6320c7CD81b1db10cEe97F2bb7AC",
    query: "0x7757BAEC9c492691eAE235c6f01FB99AaA622975",
    impact: "0x5D42d6046927DEE12b9b4a235be0ceCd55D0E0fb",
    router: "0xdCB3b5ec9170beF68E9fff21F0EDD622F72f1899",
    routerBypass: "0x3A6E9cff691a473D4D0742E1dFc8Ea263a99F6d0"
  },
  poolIndex: 36000,
  isTestNet: true,
  chainId: "0xa0c71fd",
  gridSize: 1,
  proxyPaths: {
    cold: 3,
    long: 130,
    liq: 128,
    dfltColdSwap: true
  },
  blockExplorer: "https://testnet.blastscan.io/",
  displayName: "Blast Sepolia",
};

export const CROC_CHAINS = {
  1: MAINNET_CHAIN,
  81457: BLAST_CHAIN,
  7700: CANTO_CHAIN,
  534351: SCROLL_SEPOLIA_CHAIN,
  534352: SCROLL_CHAIN,
  168587773: BLAST_SEPOLIA_CHAIN,
}
