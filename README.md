Gnosis Safe Sablier - Scripts
=================

Install
-------
Set correct node version (see `.nvmrc`) with [nvm](https://github.com/nvm-sh/nvm)
```bash
nvm use
```

Install requirements with yarn:
```bash
yarn
```

Quick Start
-----------
### Setup

Create `.env` file to use the commands (see `.env.sample` for more info):

- `NETWORK` - rinkeby
- `PK` or `MNEMONIC`- Credentials for the account that should be used
- `INFURA`- For network that use Infura based RPC
- `NODE`- RPC node


### Create Safe
Creates and setups a Safe proxy via the safe=core-sdk. (Make sure to fund your "first" named account from the hardhat.config)

#### Example
This will deploy a Safe that uses the first imported account as an owner and set the threshold to 1.
```bash
node --require hardhat/register scripts/deploy.ts 
```

### Stream DAI
Initiates a Sablier protocol stream via the safe=core-sdk. (Make sure to fund your safe with DAI & your "second" named account with ETH for gas)

#### Example
This will deploy a Safe that uses the first imported account as an owner and set the threshold to 1.
```bash
node --require hardhat/register scripts/stream.ts -s <safe-address> -t <stream-target-address>

```


