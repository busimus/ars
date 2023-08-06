// from https://github.com/dmihal/eth-permit

import { ethers } from 'ethers'
import { keccak256, encodeAbiParameters, toBytes } from 'viem'

import { ERC20PermitABI } from './abis/permit.js'

const MAX_INT =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"

const EIP712Domain = [
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" }
]

const createTypedERC2612Data = (message, domain) => {
  const typedData = {
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    },
    primaryType: "Permit",
    domain,
    message
  }

  return typedData
}

export async function fetchNonceAndName(client, tokenAddress, owner) {
  const contract = {
    address: tokenAddress,
    abi: ERC20PermitABI
  }

  const calls = [{ functionName: 'name', ...contract }, { functionName: 'version', ...contract }, { functionName: 'DOMAIN_SEPARATOR', ...contract }, { functionName: 'nonces', args: [owner], ...contract }, { functionName: '_nonces', args: [owner], ...contract }]

  let [name, version, domainHash, nonce, _nonce] = await client.multicall({ contracts: calls })
  console.log('permit reads', name, version, domainHash, nonce)
  if (name.status != "success" || (nonce.status != "success" && _nonce.status != 'success'))
    throw "This token doesn't support permits"

  if (nonce.status != 'success' && _nonce.status == 'success')
    nonce = _nonce

  return { name: name.result, version: version.result, domainHash: domainHash.result, nonce: nonce.result }
}

// calculates domain hash from given parameters and checks that it matches DOMAIN_SEPARATOR()
function verifyDomainHash(name, version, chainId, token, expectedDomainHash) {
  if (version) {
    const enc = encodeAbiParameters(
      [
        { name: 'eip', type: 'bytes32' },
        { name: 'name', type: 'bytes32' },
        { name: 'version', type: 'bytes32' },
        { name: 'chain', type: 'uint256' },
        { name: 'token', type: 'address' },
      ],
      [keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
      keccak256(toBytes(name)),
      keccak256(toBytes(version)),
        chainId,
        token]
    )
    const gotDomainHash = keccak256(enc)
    console.log('SEPARATORv', gotDomainHash)
    return gotDomainHash == expectedDomainHash
  } else {
    const enc = encodeAbiParameters(
      [
        { name: 'eip', type: 'bytes32' },
        { name: 'name', type: 'bytes32' },
        { name: 'chain', type: 'uint256' },
        { name: 'token', type: 'address' },
      ],
      [keccak256('EIP712Domain(string name,uint256 chainId,address verifyingContract)'),
      keccak256(toBytes(name)),
        chainId,
        token]
    )
    const gotDomainHash = keccak256(enc)
    console.log('SEPARATOR', gotDomainHash)
    return gotDomainHash == expectedDomainHash
  }
}

// absolute clown behavior.
// Correcty guesses: USDC, UNI, 1inch, stETH, wstETH, MNT, ARB, stkAAVE, XAUt, frxETH, sfrxETH, LUSD, R, RSR
// Incorrect: wNXM (no version() and no domainHash()), GRT (has salt), TRX and USDD (non-EIP2612), BUSD and USDP (non-EIP2612)
// No support for DAI and RAI because they use the old permit format with bool instead of quantity.
function guessDomain(name, version, chainId, token, domainHash) {
  console.log('guessing', name, version, chainId, token, domainHash)
  if (version) {
    // if (verifyDomainHash(name, version, chainId, token, domainHash))
      return {
        name,
        chainId,
        version,
        verifyingContract: token
      }
  } else {
    // 10 versions is enough versions
    for (let v = 0; v < 10; v++)
      if (verifyDomainHash(name, v.toString(), chainId, token, domainHash))
        return {
          name,
          version: v.toString(),
          chainId,
          verifyingContract: token
        }
    if (verifyDomainHash(name, null, chainId, token, domainHash))
      return {
        name,
        chainId,
        verifyingContract: token
      }
  }
  // optimistic fallback, mainly for UNI
  return {
    name,
    chainId,
    verifyingContract: token
  }
}

export const signERC2612Permit = async (
  client,
  wallet,
  tokenAddress,
  owner,
  spender,
  chainId,
  value = MAX_INT,
  deadline,
) => {
  if (!deadline)
    deadline = BigInt(parseInt(Date.now() / 1000) + 24 * 60 * 60)

  const { name, nonce, version, domainHash } = await fetchNonceAndName(client, tokenAddress, owner)
  console.log('permit token name nonce version domain', name, nonce, version, domainHash)

  const message = {
    deadline,
    nonce,
    spender,
    owner,
    value,
  }
  console.log('permit message', message)

  // const domain = {
  //   name,
  //   // version: "1",
  //   chainId,
  //   verifyingContract: tokenAddress
  // }
  // const enc = encodeAbiParameters(
  //   [
  //     { name: 'eip', type: 'bytes32' },
  //     { name: 'name', type: 'bytes32' },
  //     { name: 'chain', type: 'uint256' },
  //     { name: 'token', type: 'address' },
  //   ],
  //   [keccak256('EIP712Domain(string name,uint256 chainId,address verifyingContract)'),
  //   keccak256(toBytes(name)),
  //     chainId,
  //     tokenAddress]
  // )
  // const DOMAIN_SEPARATOR = keccak256(enc)
  // console.log('SEP', DOMAIN_SEPARATOR)

  const domain = guessDomain(name, version, chainId, tokenAddress, domainHash)
  console.log('permit domain', domain)

  const permitData = createTypedERC2612Data(message, domain)
  console.log('permit data', permitData)
  let rawSig;
  let splSig;
  try {
    rawSig = await wallet.signTypedData(permitData)
    console.log('permit raw sig', rawSig)
    splSig = ethers.utils.splitSignature(rawSig)
    console.log('permit spl sig', splSig)
  } catch (e) {
    console.error('sign permit error', e)
    return null
  }

  splSig.deadline = deadline
  return splSig
}
