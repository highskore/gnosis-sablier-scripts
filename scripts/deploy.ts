import {ethers} from 'ethers';
import {EthersAdapter} from '@gnosis.pm/safe-core-sdk';
import Safe, {SafeFactory, SafeAccountConfig} from '@gnosis.pm/safe-core-sdk';

const hre = require('hardhat');

async function main() {
  const owner1 = await hre.ethers.getSigner(1);

  console.log('Deploying safe with the account:', owner1.address);

  console.log('Account balance:', (await owner1.getBalance()).toString());

  const ethAdapter = new EthersAdapter({
    ethers,
    signer: owner1
  });

  const safeFactory = await SafeFactory.create({ethAdapter});

  const owners: string[] = [(await hre.getNamedAccounts()).first, (await hre.getNamedAccounts()).second];

  const threshold = 2;

  const safeAccountConfig: SafeAccountConfig = {
    owners,
    threshold
  };

  const safeSdk: Safe = await safeFactory.deploySafe(safeAccountConfig);

  console.log(`Deployed Safe to ${safeSdk.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
