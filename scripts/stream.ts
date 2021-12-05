import {ethers} from 'ethers';
import {Interface} from 'ethers/lib/utils';
import {MaxUint256} from '@ethersproject/constants';
import {Command} from 'commander';
import sablierABI from '../abis/sablier';
import erc20ABI from '../abis/erc20';
import {MetaTransactionData} from '@gnosis.pm/safe-core-sdk-types';
import Safe, {EthersAdapter, SafeTransactionOptionalProps, TransactionOptions} from '@gnosis.pm/safe-core-sdk';

const hre = require('hardhat');

import {options} from '../src/util/commands';

const sablierRinkebyAddress = '0xC1f3af5DC05b0C51955804b2afc80eF8FeED67b9';
const daiRinkebyAddress = '0x5eD8BD53B0c3fa3dEaBd345430B1A3a6A4e8BD7C';

async function main() {
  let provider = ethers.getDefaultProvider('rinkeby');

  const owner1 = await hre.ethers.getSigner(1);
  const owner2 = await hre.ethers.getSigner(2);

  const ethAdapterOwner1 = new EthersAdapter({
    ethers,
    signer: owner1
  });

  const ethAdapterOwner2 = new EthersAdapter({ethers, signer: owner2});

  const safeSdk: Safe = await Safe.create({ethAdapter: ethAdapterOwner1, safeAddress: options.safe});
  const safeSdk2: Safe = await safeSdk.connect({ethAdapter: ethAdapterOwner2, safeAddress: options.safe});

  let txs: MetaTransactionData[] = [];

  // DAI
  const erc20Interface: Interface = new Interface(erc20ABI);
  const token = new ethers.Contract(daiRinkebyAddress, erc20ABI, provider);

  // Sablier
  const sablierInterface: Interface = new Interface(sablierABI);
  const deposit = '2999999999999998944000';
  const now = Math.round(new Date().getTime() / 1000); // get seconds since unix epoch
  const startTime = now + 3600; // 1 hour from now
  const stopTime = now + 2592000 + 3600; // 30 days and 1 hour from now
  const recipient = options.target;

  // approve the transfer
  const approveTx = {
    data: erc20Interface.encodeFunctionData('approve', [sablierRinkebyAddress, MaxUint256.toString()]),
    to: token.address,
    value: '0',
    operation: 1
  };

  // create the stream
  const createStreamTx = {
    data: sablierInterface.encodeFunctionData('createStream', [
      recipient,
      deposit.toString(),
      token.address,
      startTime,
      stopTime
    ]),
    to: sablierRinkebyAddress,
    value: '0',
    operation: 1
  };

  // compose multi-transaction
  txs.push(approveTx);
  txs.push(createStreamTx);

  const nonce = await safeSdk.getNonce();

  const transactionOptions: SafeTransactionOptionalProps = {
    nonce
  };
  const safeTransaction = await safeSdk.createTransaction(txs, transactionOptions);

  // sign & execute transaction
  await safeSdk.signTransaction(safeTransaction); // owner 1

  const executeOptions: TransactionOptions = {
    gasLimit: 1500000,
    gasPrice: 500000 // Optional
  };

  const executeTxResponse = await safeSdk2.executeTransaction(safeTransaction, executeOptions); // owner 2
  console.log(await executeTxResponse.transactionResponse?.wait());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
