import {ethers} from 'ethers';
import {Interface} from 'ethers/lib/utils';
import {MaxUint256} from '@ethersproject/constants';
import sablierABI from '../abis/sablier';
import erc20ABI from '../abis/erc20';
import {MetaTransactionData} from '@gnosis.pm/safe-core-sdk-types';
import Safe, {EthersAdapter, SafeTransactionOptionalProps, TransactionOptions} from '@gnosis.pm/safe-core-sdk';

const hre = require('hardhat');

import {options} from '../src/util/commands';

const sablierRinkebyAddress = '0xC1f3af5DC05b0C51955804b2afc80eF8FeED67b9';
const daiRinkebyAddress = '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea';

async function main() {
  const getGasPrice = await hre.ethers.provider.getGasPrice();

  const owner1 = await hre.ethers.getSigner(1);
  const owner2 = await hre.ethers.getSigner(2);

  const ethAdapterOwner1 = new EthersAdapter({
    ethers,
    signer: owner1
  });

  const ethAdapterOwner2 = new EthersAdapter({
    ethers,
    signer: owner2
  });

  const safeSdk: Safe = await Safe.create({
    ethAdapter: ethAdapterOwner1,
    safeAddress: options.safe
  });

  const safeSdk2: Safe = await safeSdk.connect({
    ethAdapter: ethAdapterOwner2,
    safeAddress: options.safe
  });

  console.log('Using safe: ', safeSdk.getAddress());

  let txs: MetaTransactionData[] = [];

  // DAI
  const erc20Interface: Interface = new Interface(erc20ABI);

  // Sablier
  const sablierInterface: Interface = new Interface(sablierABI);
  const deposit = '3000000000000000000';
  const now = Math.round(new Date().getTime() / 1000); // get seconds since unix epoch
  const startTime = now + 600; // 10 minute
  const stopTime = now + 3600; // 1 hour from now
  const recipient = options.target;

  // approve the transfer
  const approveTx = {
    data: erc20Interface.encodeFunctionData('approve', [sablierRinkebyAddress, MaxUint256.toString()]),
    to: daiRinkebyAddress,
    value: '0'
  };

  // create the stream
  const createStreamTx = {
    data: sablierInterface.encodeFunctionData('createStream', [
      recipient,
      deposit.toString(),
      daiRinkebyAddress,
      startTime,
      stopTime
    ]),
    to: sablierRinkebyAddress,
    value: '0'
  };

  // compose multi-transaction
  txs.push(approveTx);
  txs.push(createStreamTx);

  console.log('Creating transacation...');

  const txOptions: SafeTransactionOptionalProps = {
    safeTxGas: 5000000,
    baseGas: 2000000,
    gasPrice: getGasPrice
  };

  const safeTransaction = await safeSdk.createTransaction(txs, txOptions);

  // sign transaction with owner 2
  await safeSdk2.signTransaction(safeTransaction); // owner 2

  console.log('Signed transaction with owner 2: ', owner2.address);

  // execute transaction
  const executeOptions: TransactionOptions = {
    gasLimit: 5960000,
    gasPrice: getGasPrice
  };

  console.log('Executing transaction...');

  const executeTxResponse = await safeSdk.executeTransaction(safeTransaction, executeOptions);

  console.log('Signed & executed transaction with owner 1: ', owner1.address);

  console.log('Awaiting transaction response...');
  await executeTxResponse.transactionResponse?.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
