import { tokens, EVM_REVERT } from './helpers'

const Token = artifacts.require('./Token')

require('chai')
	.use(require('chai-as-promised'))
	.should()

contract('Token', (accounts) => {
	const name = 'Port'
	const symbol = 'PRT'
	const decimals = '18'
	const totalSupply = tokens(1000000).toString()
	let token

	beforeEach(async () => {
		token = await Token.new()
	})

	describe('deployment', () => {
		it('tracks the name', async() => {
			const result = await token.name()
			result.should.equal(name)
		})

		it('tracks the symbol', async() => {
			const result = await token.symbol()
			result.should.equal(symbol)
		})

		it('tracks the decimals', async() => {
			const result = await token.decimals()
			result.toString().should.equal(decimals)
		})

		it('tracks the total supply', async() => {
			const result = await token.totalSupply()
			result.toString().should.equal(totalSupply.toString())
		})

		it('assigns total supply to deployer', async() => {
			const result = await token.balanceOf(accounts[0])
			result.toString().should.equal(totalSupply.toString())
		})
	})

	describe('sending tokens', () => {
		let amount
		let result

		describe('success', () => {

			beforeEach(async () => {
				amount = tokens(10)
				result = await token.transfer(accounts[1], amount, { from: accounts[0] })
			})

			it('transfers token balances', async () => {
				let balanceOf
				balanceOf = await token.balanceOf(accounts[0])
				balanceOf.toString().should.equal(tokens(999990).toString())
				balanceOf = await token.balanceOf(accounts[1])
				balanceOf.toString().should.equal(tokens(10).toString())
			})

			it('emits a transfer event', () => {
				const log = result.logs[0]
				log.event.should.equal('Transfer')
				const event = log.args
				event.from.should.equal(accounts[0])
				event.to.should.equal(accounts[1])
				event.value.toString().should.equal(amount.toString())
			})
		})

		describe('failure', () => {

			it('rejects insufficient balances', async () => {
				let invalidAmount
				invalidAmount = tokens(100000000)
				await token.transfer(accounts[1], invalidAmount, { from: accounts[0] }).should.be.rejectedWith(EVM_REVERT)
			})

			it('rejects invalid recipients', async () => {
				await token.transfer(0x0, amount, { from: accounts[0] }).should.be.rejected
			})
		})
	})

	describe('approving tokens', () => {
		let result
		let amount

		beforeEach(async () => {
			amount = tokens(100)
			result = await token.approve(accounts[2], amount, { from: accounts[0] })
		})

		describe('success', () => {
			it('allocates an allowance for delegating spending', async () => {
				const allowance = await token.allowance(accounts[0], accounts[2])
				allowance.toString().should.equal(amount.toString())
			})

			it('emits an approval event', () => {
				const log = result.logs[0]
				log.event.should.equal('Approval')
				const event = log.args
				event._owner.toString().should.equal(accounts[0], 'owner is correct')
				event._spender.toString().should.equal(accounts[2], 'spender is correct')
				event._value.toString().should.equal(amount.toString())

			})
		})

		describe('failure', () => {
			it('rejects invalid spenders', async () => {
				await token.approve(0x0, amount, { from: accounts[0] }).should.be.rejected
			})
		})
	})

	describe('delegated token transfers', () => {
		let amount
		let result

		beforeEach(async () => {
			amount = tokens(10)
			await token.approve(accounts[2], amount, { from: accounts[0]})
		})

		describe('success', () => {

			beforeEach(async () => {
				result = await token.transferFrom(accounts[0], accounts[1], amount, { from: accounts[2] })
			})

			it('transfers token balances', async () => {
				let balanceOf
				balanceOf = await token.balanceOf(accounts[0])
				balanceOf.toString().should.equal(tokens(999990).toString())
				balanceOf = await token.balanceOf(accounts[1])
				balanceOf.toString().should.equal(tokens(10).toString())
			})

			it('resets the allowance', async () => {
				const allowance = await token.allowance(accounts[0], accounts[2])
				allowance.toString().should.equal('0')
			})

			it('emits a transfer event', () => {
				const log = result.logs[0]
				log.event.should.equal('Transfer')
				const event = log.args
				event.from.should.equal(accounts[0])
				event.to.should.equal(accounts[1])
				event.value.toString().should.equal(amount.toString())
			})
		})

		describe('failure', () => {

			it('rejects insufficient balances', async () => {
				let invalidAmount
				invalidAmount = tokens(100000000)
				await token.transferFrom(accounts[0], accounts[1], invalidAmount, { from: accounts[2] }).should.be.rejectedWith(EVM_REVERT)
			})

			it('rejects invalid approved amount', async () => {
				let invalidApprovedAmount
				invalidApprovedAmount = tokens(100)
				await token.transferFrom(accounts[0], accounts[1], invalidApprovedAmount, { from: accounts[2] }).should.be.rejected
			})

			it('rejects invalid recipients', async () => {
				await token.transferFrom(accounts[0], 0x0, amount, { from: accounts[2] }).should.be.rejected
			})
		})
	})
})