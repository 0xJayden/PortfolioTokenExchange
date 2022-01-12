import { tokens, EVM_REVERT, ETHER_ADDRESS, ether } from './helpers'

const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')

require('chai')
	.use(require('chai-as-promised'))
	.should()

contract('Exchange', (accounts) => {
	let exchange
	let token
	const feePercent = 10

	beforeEach(async () => {
		token = await Token.new()
		exchange = await Exchange.new(accounts[1], feePercent)
		token.transfer(accounts[2], tokens(100), { from: accounts[0] })
	})

	describe('deployment', () => {
		it('tracks the fee account', async() => {
			const result = await exchange.feeAccount()
			result.should.equal(accounts[1])
		})

		it('tracks the fee percent', async() => {
			const result = await exchange.feePercent()
			result.toString().should.equal(feePercent.toString())
		})
	})

	describe('fallback', () => {
		it('reverts if Ether is sent to the exchange', async () => {
			await exchange.sendTransaction({ value: 1, from: accounts[2] }).should.be.rejectedWith(EVM_REVERT)
		})
	})

	describe('depositing Ether', () => {
		let result
		let amount

		beforeEach(async () => {
			amount = ether(1)
			result = await exchange.depositEther({ from: accounts[2], value: amount })
		})

		it('tracks Ether deposit', async () => {
			let balance
			balance = await exchange.tokens(ETHER_ADDRESS, accounts[2])
			balance.toString().should.equal(amount.toString())
		})

		it('emits a deposit event', () => {
			const log = result.logs[0]
			log.event.should.equal('Deposit')
			const event = log.args
			event._token.should.equal(ETHER_ADDRESS)
			event._user.should.equal(accounts[2])
			event._amount.toString().should.equal(amount.toString())
			event._balance.toString().should.equal(amount.toString())
		})
	})

	describe('withdraw Ether', () => {
		let amount
		let result
		let balance

		beforeEach(async () => {
			amount = ether(1)
			await exchange.depositEther( { value: amount, from: accounts[2] })
		})

		describe('success', () => {

			beforeEach(async () => {
			result = await exchange.withdrawEther(amount, { from: accounts[2] })
			})

			it('withdraws Ether funds', async () => {
				balance = await exchange.tokens(ETHER_ADDRESS, accounts[2])
				balance.toString().should.equal('0')
			})

			it('emits withdraw event', async () => {
				const log = result.logs[0]
				log.event.should.equal('Withdraw')
				const event = log.args
				event._token.should.equal(ETHER_ADDRESS)
				event._user.should.equal(accounts[2])
				event._amount.toString().should.equal(amount.toString())
				event._balance.toString().should.equal('0')
			})
		})

		describe('failure', () => {
			let invalidAmount

			it('rejects attempt to withdraw more tokens than they have', async () => {
				invalidAmount = ether(2)
				await exchange.withdrawEther(invalidAmount, { from: accounts[2] }).should.be.rejected
			})
		})
	})

	describe('depositing tokens', () => {
		let amount
		let result

		describe('success', () => {

			beforeEach(async () => {
			amount = tokens(10)
			await token.approve(exchange.address, amount, { from: accounts[2] })
			result = await exchange.depositToken(token.address, amount, { from: accounts[2]} )
			})

			it('tracks the token deposit', async () => {
				let balance
				balance = await token.balanceOf(exchange.address)
				balance.toString().should.equal(amount.toString())
				balance = await exchange.tokens(token.address, accounts[2])
				balance.toString().should.equal(amount.toString())
			})

			it('emits a deposit event', () => {
				const log = result.logs[0]
				log.event.should.equal('Deposit')
				const event = log.args
				event._token.should.equal(token.address)
				event._user.should.equal(accounts[2])
				event._amount.toString().should.equal(amount.toString())
				event._balance.toString().should.equal(amount.toString())
			})
		})

		describe('failure', () => {
			it('fails when no tokens are approved', async () => {
				await exchange.depositToken(token.address, tokens(10), { from: accounts[2] }).should.be.rejectedWith(EVM_REVERT)
			})

			it('rejects Ether deposits', async () => {
				await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: accounts[2] }).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('withdraw tokens', () => {
		let amount
		let result

		describe('success', () => {

			beforeEach(async () => {
				amount = tokens(10)
				await token.approve(exchange.address, amount, { from: accounts[2]} )
				await exchange.depositToken(token.address, amount, { from: accounts[2]} )
				result = await exchange.withdrawToken(token.address, amount, { from: accounts[2]} )
			})

			it('it withdraws token funds', async () => {
				const balance = await exchange.tokens(token.address, accounts[2])
				balance.toString().should.equal('0')
			})

			it('emits withdraw event', async () => {
				const log = result.logs[0]
				log.event.should.equal('Withdraw')
				const event = log.args
				event._token.should.equal(token.address)
				event._user.should.equal(accounts[2])
				event._amount.toString().should.equal(amount.toString())
				event._balance.toString().should.equal('0')
			})
		})

		describe('failure', () => {

			it('rejects Ether withdraws', async () => {
				await exchange.withdrawToken(ETHER_ADDRESS, ether(1), { from: accounts[2] }).should.be.rejectedWith(EVM_REVERT)
			})

			it('fails for insufficient balance', async () => {
				await exchange.withdrawToken(token.address, tokens(1), { from: accounts[2] }).should.be.rejectedWith(EVM_REVERT)
			})

		})
	})

	describe('Check balance', () => {
		let amount

		beforeEach(async () => {
			amount = tokens(100)
			await token.approve(exchange.address, amount, { from: accounts[2] })
			await exchange.depositToken(token.address, amount, { from: accounts[2] })
		})

		it('returns user balance', async () => {
			const result = await exchange.balanceOf(token.address, accounts[2])
			result.toString().should.equal(amount.toString())
		})
	})

	describe('Making Order', () => {
		let result

		beforeEach(async () => {
			result = await exchange.makeOrder(token.address, tokens(10), ETHER_ADDRESS, ether(1), { from: accounts[2] })
		})
		it('tracks newly created order', async () => {
			const orderCount = await exchange.orderCount()
			orderCount.toString().should.equal('1')
			const order = await exchange.orders(orderCount)
			order.id.toString().should.equal('1')
			order.user.should.equal(accounts[2])
			order.tokenGet.should.equal(token.address)
			order.amountGet.toString().should.equal(tokens(10).toString())
			order.tokenGive.should.equal(ETHER_ADDRESS)
			order.amountGive.toString().should.equal(ether(1).toString())
			order.timestamp.toString().length.should.be.at.least(1)
		})

		it('emits an order event', async () => {
			const log = result.logs[0]
			log.event.should.equal('Order')
			const event = log.args
			event.id.toString().should.equal('1')
			event.user.should.equal(accounts[2])
			event.tokenGet.should.equal(token.address)
			event.amountGet.toString().should.equal(tokens(10).toString())
			event.tokenGive.should.equal(ETHER_ADDRESS)
			event.amountGive.toString().should.equal(ether(1).toString())
			event.timestamp.toString().length.should.be.at.least(1)
		})
	})

	describe('Order actions', () => {

		beforeEach(async () => {
			await exchange.depositEther({ from: accounts[2], value: ether(1) })
			await token.transfer(accounts[3], tokens(100), { from: accounts[0] })
			await token.approve(exchange.address, tokens(50), { from: accounts[3]})
			await exchange.depositToken(token.address, tokens(50), { from: accounts[3]})
			await exchange.makeOrder(token.address, tokens(10), ETHER_ADDRESS, ether(1), { from: accounts[2] })

		})

		describe('Filling orders', () => {
			let result

			describe('success', () => {

				beforeEach(async () => {
					result = await exchange.fillOrder('1', { from: accounts[3] })
					console.log(result.logs)
				})
				it('Executes the trade & charges fees', async () => {
					let balance
					balance = await exchange.balanceOf(token.address, accounts[2])
					balance.toString().should.equal(tokens(10).toString(), 'User1 received tokens')
					balance = await exchange.balanceOf(token.address, accounts[3])
					balance.toString().should.equal(tokens(39).toString(), 'User2 tokens deducted with fee')
					balance = await exchange.balanceOf(ETHER_ADDRESS, accounts[2])
					balance.toString().should.equal('0', 'User1 Ether deducted')
					balance = await exchange.balanceOf(ETHER_ADDRESS, accounts[3])
					balance.toString().should.equal(ether(1).toString(), 'User2 received Ether')
					balance = await exchange.balanceOf(token.address, accounts[1])
					balance.toString().should.equal(tokens(1).toString(), 'Fee account received fee')
				})

				it('Updates filled orders', async () => {
					const orderFilled = await exchange.orderFilled(1)
					orderFilled.should.equal(true)
				})

				it('emits a trade event', async () => {
					const log = result.logs[0]
					log.event.should.equal('Trade')
					const event = log.args
					event.id.toString().should.equal('1')
					event.user.should.equal(accounts[2])
					event.tokenGet.should.equal(token.address)
					event.amountGet.toString().should.equal(tokens(10).toString())
					event.tokenGive.should.equal(ETHER_ADDRESS)
					event.amountGive.toString().should.equal(ether(1).toString())
					event.userFill.should.equal(accounts[3])
					event.timestamp.toString().length.should.be.at.least(1)
				})
			})

			describe('Failure', () => {
				it('rejects invalid id', async () => {
					const invalidOrderId = 3
					await exchange.fillOrder(invalidOrderId, { from: accounts[3] }).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects already filled orders', async () => {
					await exchange.fillOrder('1', { from: accounts[3] }).should.be.fulfilled
					await exchange.fillOrder('1', { from: accounts[3] }).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects cancelled orders', async () => {
					await exchange.cancelOrder('1', { from: accounts[2] }).should.be.fulfilled
					await exchange.fillOrder('1', { from: accounts[3] }).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})

		describe('Cancelling orders', () => {
			let result

			describe('success', () => {

				beforeEach(async () => {
					result = await exchange.cancelOrder('1', { from: accounts[2] })
				})

				it('updates cancelled orders', async () => {
					const orderCancelled = await exchange.orderCancelled(1)
					orderCancelled.should.equal(true)
				})

				it('emits a cancel event', async () => {
					const log = result.logs[0]
					log.event.should.equal('Cancel')
					const event = log.args
					event.id.toString().should.equal('1')
					event.user.should.equal(accounts[2])
					event.tokenGet.should.equal(token.address)
					event.amountGet.toString().should.equal(tokens(10).toString())
					event.tokenGive.should.equal(ETHER_ADDRESS)
					event.amountGive.toString().should.equal(ether(1).toString())
					event.timestamp.toString().length.should.be.at.least(1)
				})
			})

			describe('failure', () => {
				it('rejects invalid order ids', async () => {
					const invalidOrderId = 3
					await exchange.cancelOrder(invalidOrderId, { from: accounts[2] }).should.be.rejectedWith(EVM_REVERT)
				})

				it('rejects unauthorized cancellations', async () => {
					await exchange.cancelOrder('1', { from: accounts[3] }).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})
})