# Ambient Relay Service

This is an alternative frontend for [Ambient Finance](https://ambient.finance) that has a gasless transaction relayer. It allows users to execute DEX commands without needing gas on their address if they have enough tokens on their DEX balance.

## Features
* Supports balance withdrawal/transfer, LP removal, // TODO: limit order removal, ERC721 deposits, swaps
* Different ways of command execution:
    * Fully relayed mode – if you don't have any ETH on any address, but have enough DEX balance to pay a tip to the relayer
    * Manually relayed mode – if you have a ETH on a different address but don't want to (or can't) send it to the address in question
    * Manual mode – regular transactions like the official frontend sends
* Tips are based on gas estimates of the transaction and can be paid with any token that the relayer permits
* Tip value is verified based on onchain price against ETH

## Screenshot
<img src="/screenshots/ars.png?raw=true" height="200">

## Building and running

1. Deposit ETH to a relayer address and specify its private key in the `PK` environment variable
2. Set the domain of your relayer endpoint in the `RELAYERS` variable in `frontend/src/App.vue`
3. Build and run `relayer`: `npm install && node run index.mjs`
4. Build and deploy `frontend`: `npm install && npm run build`

## Attributions
* [Vue](https://github.com/vuejs/vue/) – MIT License, Copyright (c) 2013-present, Yuxi (Evan) You
* [Bootstrap](https://github.com/twbs/bootstrap) – MIT License, Copyright (c) 2011-2023 The Bootstrap Authors
* [Bootstrap-vue](https://github.com/bootstrap-vue/bootstrap-vue) – MIT License, Copyright (c) 2016-2023 - BootstrapVue
* [ethers.js](https://github.com/ethers-io/ethers.js) – MIT License, Copyright (c) 2016-2023 Richard Moore
* [CrocSwap SDK](https://github.com/CrocSwap/sdk/) – MIT License, Copyright (c) 2022 Crocodile Labs, Inc.
* [web3modal](https://github.com/WalletConnect/web3modal) – Apache License 2.0, Copyright 2021 WalletConnect, Inc.
* [viem](https://github.com/wagmi-dev/viem)+[wagmi](https://github.com/wagmi-dev/wagmi) – MIT License, Copyright (c) 2022-present weth, LLC
* [Express](https://github.com/expressjs/express)+[Morgan](https://github.com/expressjs/morgan) – MIT License, Copyright (c) 2009-2014 TJ Holowaychuk, Copyright (c) 2013-2014 Roman Shtylman, Copyright (c) 2014-2015 Douglas Christopher Wilson
* [Lifesaver SVG](https://openclipart.org/detail/3332/lifesaver) – CC0 1.0 Universal License, Barret Ruttan
* [Outward font](https://velvetyne.fr/fonts/outward/) – SIL Open Font License 1.1, Raoul Audouin, Velvetyne Type Foundry

### Copyright and license
This project is released under the MIT License (see LICENSE file).

Copyright © 2023 bus.
