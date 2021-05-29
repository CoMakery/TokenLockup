// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat')
const fs = require('fs')
const deploymentParamsLog = 'deployment.json'
const config = hre.network.config
console.log('\n\nDeploy Network: ', hre.network.name)
console.log('hardhat.config.js lockup params:')
console.log(config.lockup)

if(config.lockup.tokenAddress == null ||
  config.lockup.tokenAddress == undefined ||
  config.lockup.tokenAddress == "") {
  throw "config.lockup.tokenAddress must be configured in hardhat.config.js"
}

// Hardhat always runs the compile task when running scripts with its command
// line interface.
//
// If this script is run directly using `node` you may want to call compile
// manually to make sure everything is compiled
// await hre.run('compile');

async function main () {
  const tokenArtifact = await artifacts.readArtifact('TokenLockup')
  const token = new ethers.Contract(config.lockup.tokenAddress, tokenArtifact.abi, ethers.provider)

  console.log('token details for TokenLockup deployment:')
  console.log('[tokenAddress, TokenLockup name, TokenLockup symbol, minReleaseScheduleAmountInBaseTokens, maxReleaseDelay]')
  const TokenLockupArgs = [
    await token.address, // tokenAddress '0xE322488096C36edccE397D179E7b1217353884BB'
    await token.name() + ' Lockup', // tokenLockup name (different than token)
    await token.symbol() + ' Lockup', // tokenLockup symbol (different than token)
    config.lockup.minReleaseScheduleAmountInBaseTokens,
    config.lockup.maxReleaseDelay
  ]
  console.log(TokenLockupArgs)

  const ScheduleCalc = await hre.ethers.getContractFactory('ScheduleCalc')
  const scheduleCalc = await ScheduleCalc.deploy()
  console.log('Deployed scheduleCalc at: ', scheduleCalc.address)

  await scheduleCalc.deployTransaction.wait(1)
  console.log('1 scheduleCalc confirmations completed')

  console.log('deploying token lockup')
  const TokenLockup = await hre.ethers.getContractFactory('TokenLockup', {
    libraries: {
      ScheduleCalc: scheduleCalc.address
    }
  })

  const tokenLockup = await TokenLockup.deploy(
    ...TokenLockupArgs,
    {
      gasLimit: 4000000
    })
  console.log('Deployed tokenLockup at: ', tokenLockup.address)
  console.log('waiting for 5 blockchain block confirmations')
  await tokenLockup.deployTransaction.wait(5)
  console.log('5 confirmations completed')

  let deploymentParamsLogFile = fs.readFileSync(deploymentParamsLog)
  let deploymentParamsLogContent = JSON.parse(deploymentParamsLogFile)

  let updatedContent = Object.assign(deploymentParamsLogContent, {
    [hre.network.name.toString()]: {
      scheduleCalc: {
        args: [],
        transaction: scheduleCalc.deployTransaction.hash,
        address: scheduleCalc.address
      },
      tokenLockup: {
        args: TokenLockupArgs,
        transaction: tokenLockup.deployTransaction.hash,
        address: tokenLockup.address
      }
    }
  })

  fs.writeFileSync(
    deploymentParamsLog,
    JSON.stringify(updatedContent)
  )

  // upload the contracts Etherscan for verification
  // await hre.run('verify:verify', {
  //   address: tokenLockup.address,
  //   constructorArguments: TokenLockupArgs
  // })
  //
  // await hre.run('verify:verify', {
  //   address: scheduleCalc.address
  // })
  console.log('done!')
  console.log('now run scripts to upload contract definitions for ScheduleCalc & TokenLockup contracts to Ethersacn')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })