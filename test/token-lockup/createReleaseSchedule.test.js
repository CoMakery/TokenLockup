const hre = require('hardhat')
const chai = require('chai')
const { expect } = chai
const { solidity } = require('ethereum-waffle')
chai.use(solidity)

describe('TokenLockup create release schedule', async function () {
  let tokenLockup, token, reserveAccount
  const decimals = 10
  const totalSupply = 8e9

  beforeEach(async () => {
    const accounts = await hre.ethers.getSigners()

    reserveAccount = accounts[0]

    const Token = await hre.ethers.getContractFactory('Token')

    token = await Token.deploy(
      'Test Scheduled Release Token',
      'SCHR',
      decimals,
      totalSupply,
      [accounts[0].address],
      [totalSupply]
    )
    const ScheduleCalc = await hre.ethers.getContractFactory('ScheduleCalc')
    const scheduleCalc = await ScheduleCalc.deploy()
    const TokenLockup = await hre.ethers.getContractFactory('TokenLockup', {
      libraries: {
        ScheduleCalc: scheduleCalc.address
      }
    })
    tokenLockup = await TokenLockup.deploy(
      token.address,
      'Xavier Yolo Zeus Token Lockup Release Scheduler',
      'XYZ Lockup',
      1e4,
      346896000
    )
  })

  it('increments the schedulerCount', async function () {
    await expect(tokenLockup.connect(reserveAccount).createReleaseSchedule(2, 0, 1, 1))
      .to.emit(tokenLockup, "ScheduleCreated")
      .withArgs(reserveAccount.address, 0)
    expect(await tokenLockup.scheduleCount()).to.equal(1)
    await expect(tokenLockup.connect(reserveAccount).createReleaseSchedule(2, 0, 1, 1))
      .to.emit(tokenLockup, 'ScheduleCreated')
      .withArgs(reserveAccount.address, 1)
    expect(await tokenLockup.scheduleCount()).to.equal(2)
  })

  it('emits a CreateSchedule event', async () => {
    await expect(tokenLockup.connect(reserveAccount).createReleaseSchedule(2, 0, 1, 1))
      .to.emit(tokenLockup, 'ScheduleCreated')
      .withArgs(reserveAccount.address, 0)
  })

  it('must have at least 1 release', async function () {
    let error
    try {
      await tokenLockup.connect(reserveAccount).createReleaseSchedule(0, 1, 1, 1)
    } catch (e) {
      error = e
    }

    expect(error.message).to.match(/revert < 1 release/)
  })

  it('if there is one release it must release all tokens', async function () {
    let error
    try {
      await tokenLockup.connect(reserveAccount).createReleaseSchedule(1, 0, 1, 1)
    } catch (e) {
      error = e
    }

    expect(error.message).to.match(/released < 100%/)
  })

  it('if there is one release it can release all tokens on the first batch', async function () {
    const tx = await tokenLockup.connect(reserveAccount).createReleaseSchedule(1, 0, 10000, 1)
    const scheduleId = tx.value.toString()
    expect(scheduleId).to.equal('0')
    const schedule = await tokenLockup.connect(reserveAccount).releaseSchedules(scheduleId)
    expect(schedule.initialReleasePortionInBips).to.equal(10000)
  })

  it('initial release amount cannot exceed 100% (100 00 bips', async function () {
    let error
    try {
      await tokenLockup.connect(reserveAccount).createReleaseSchedule(1, 0, 10001, 1)
    } catch (e) {
      error = e
    }

    expect(error.message).to.match(/release > 100%/)
  })

  it('must have a period duration of at least 1 second', async function () {
    let error
    try {
      await tokenLockup.connect(reserveAccount).createReleaseSchedule(2, 2, 5000, 0)
    } catch (e) {
      error = e
    }

    expect(error.message).to.match(/period = 0/)
  })
})
