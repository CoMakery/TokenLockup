require('@nomiclabs/hardhat-waffle')
require('solidity-coverage')
require('hardhat-gas-reporter')
require('dotenv').config({ path: 'mnemonic.env'});

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more


/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      token: {
        name: 'Token Test XYZ',
        symbol: 'XYZ',
        decimals: 10,
        totalSupply: 100,
        mintAddresses: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
        mintAmounts: [100]
      },
      lockup: {
        minReleaseScheduleAmount: 10 * 1e10 // 10 tokens with 10 decimals
      }
    },
    rinkeby: {
      token: {
        name: 'Token Test XYZ',
        symbol: 'XYZ',
        decimals: 10,
        totalSupply: 100,
        mintAddresses: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
        mintAmounts: [100]
      },
      lockup: {
        minReleaseScheduleAmount: 10 * 1e10 // 10 tokens with 10 decimals
      },
      url: 'https://eth-rinkeby.alchemyapi.io/v2/8ohf9ggpgkO1yfBvfX0sGIyGeVkEEt0T',
      accounts:  {
          mnemonic: process.env.RINKEBY
        },
      gas: 4 * 1e6
    }
  },
  solidity: '0.8.3',
  gasReporter: {
    coinmarketcap: process.env.COIN_MARKET_CAP_API,
    currency: 'USD',
    gasPrice: 120,
    enabled: true
  }
}
