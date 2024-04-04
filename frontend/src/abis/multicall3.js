export const MULTICALL_ABI = [
    {
      "name": "aggregate3",
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "target",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "allowFailure",
              "type": "bool"
            },
            {
              "internalType": "bytes",
              "name": "callData",
              "type": "bytes"
            }
          ],
          "internalType": "struct Multicall3.Call3[]",
          "name": "calls",
          "type": "tuple[]"
        }
      ],
      "outputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "success",
              "type": "bool"
            },
            {
              "internalType": "bytes",
              "name": "returnData",
              "type": "bytes"
            }
          ],
          "internalType": "struct Multicall3.Result[]",
          "name": "returnData",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "name": "aggregate3Value",
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "target",
              "type": "address"
            },
            {
              "internalType": "bool",
              "name": "allowFailure",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "value",
              "type": "uint256"
            },
            {
              "internalType": "bytes",
              "name": "callData",
              "type": "bytes"
            }
          ],
          "internalType": "struct Multicall3.Call3Value[]",
          "name": "calls",
          "type": "tuple[]"
        }
      ],
      "outputs": [
        {
          "components": [
            {
              "internalType": "bool",
              "name": "success",
              "type": "bool"
            },
            {
              "internalType": "bytes",
              "name": "returnData",
              "type": "bytes"
            }
          ],
          "internalType": "struct Multicall3.Result[]",
          "name": "returnData",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
  ]
