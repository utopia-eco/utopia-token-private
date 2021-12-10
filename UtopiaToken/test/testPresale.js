const {assert} = require('chai')
const truffleAssert = require('truffle-assertions');

const UtopiaToken = artifacts.require("UtopiaToken");
const UtopiaPresale = artifacts.require("UtopiaPresale");

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

})

describe('Testing Utopia', async () => {
    var utopiaToken;
    var utopiaPresale;
    beforeEach(async function () {
        this.timeout(10000);
        utopiaToken = await UtopiaToken.deployed();
        utopiaPresale = await UtopiaPresale.deployed();
    })

    contract ("UtopiaToken", function(accounts) {
        it('Should deploy smart contract properly', async () => {
            assert.notDeepEqual(utopiaToken.address, '', "Unable to retrieve address for UtopiaToken");
        })
        it('Should provide originator with the correct number of UtopiaTokens', async () => {
            var balance = await utopiaToken.balanceOf.call(accounts[0]);
            assert.strictEqual(balance.toString(), "1000000000000000000000")
        })
        it('Should tax the correct number of UtopiaTokens for a small transfer', async () => {
            var lowTax = await utopiaToken.calculateFee(100, 10)
            assert.strictEqual(lowTax.toString(), "10")
        })
        it('Should tax the correct number of UtopiaTokens for a large transfer', async () => {
            var highTax = BigInt(await utopiaToken.calculateFee("2000000000000000000", 10)).toString()
            assert.strictEqual(highTax, "400000000000000000")
        })
        it('Should prevent transactions to wallets more than capped amount', async() => {
            await utopiaToken.transfer(accounts[1], "100000000000000000000")
            await truffleAssert.reverts(utopiaToken.transfer(accounts[2], "100000000000000000000", {from: accounts[1]}))
        })
    })

    contract ("Presale", accounts => {
        it('Should deploy smart contract properly', async () => {
            assert.notDeepEqual(utopiaPresale.address, '', "Unable to retrieve address for Presale");
        })
        it('Should be able to exclude the presale contract from taxes', async () => {
            await utopiaToken.excludeFromFee(utopiaPresale.address);
            var result = await utopiaToken.isExcludedFromFee(utopiaPresale.address);
            assert.isTrue(result, "Unable to exclude presale smart contract from taxes")
        })
        it('Should be able to be send tokens to the smart contract', async() => {
            await utopiaToken.transfer(utopiaPresale.address, BigInt(250000000000000000000))  // 250B (25% of total supply)
            var presaleUtopiaBalance = await utopiaToken.balanceOf.call(utopiaPresale.address);
            assert.strictEqual(presaleUtopiaBalance.toString(), "250000000000000000000", "Unable to transfer tokens to smart contract")
        })
        it('Should be able to be buy tokens', async() => {
            // Purchase 0.1 bnb worth of tokens from the presale smart contract
            await utopiaPresale.buyTokens(accounts[1], {from: accounts[1], value: "100000000000000000"})
            var purchaserAddress = await utopiaPresale.purchaserList(0)
            assert.strictEqual(purchaserAddress, accounts[1], "First buyer did not go through") 
            var accounts1PurchasedAmount = BigInt(await utopiaPresale.purchasedBnb(accounts[1])).toString()
            assert.strictEqual(accounts1PurchasedAmount, "100000000000000000", "First buyer's purchase was not recorded") 

            await utopiaPresale.buyTokens(accounts[2], {from: accounts[2], value: "100000000000000000"})
            var purchaserAddress = await utopiaPresale.purchaserList(1)
            assert.strictEqual(purchaserAddress, accounts[2], "Second buyer did not go through") 
            var accounts1PurchasedAmount = BigInt(await utopiaPresale.purchasedBnb(accounts[2])).toString()
            assert.strictEqual(accounts1PurchasedAmount, "100000000000000000", "Second buyer's purchase was not recorded")

            var accountOneUtopia =  await utopiaToken.balanceOf.call(accounts[1]);
            assert.strictEqual(accountOneUtopia.toString(), "0", "Utopia should have not yet been sent to purchaser address")

        })
        it('Should be able to be finalized', async() => {
            await utopiaPresale.finalize({from: accounts[0]})
            var finalized = await utopiaPresale.finalized();
            assert.strictEqual(finalized, true, "Unable to finalize smart contract")
        })

        it('Owner should be able to withdraw bnb', async() => {
            var ownerBalanceBeforeReceivingFunds = await web3.eth.getBalance(accounts[0])
            await utopiaPresale.forwardFunds();
            
            var ownerBalanceAfterReceivingFunds = await web3.eth.getBalance(accounts[0])
            assert.isTrue(BigInt(ownerBalanceBeforeReceivingFunds) < BigInt(ownerBalanceAfterReceivingFunds), 
                "Owner's fund before is " + ownerBalanceBeforeReceivingFunds.toString() + 
                " which is less than what it is after at " + ownerBalanceAfterReceivingFunds.toString())
        })
        it('Users should be able to withdraw tokens', async() => { 
            await utopiaPresale.withdrawTokens({from: accounts[1]})
            var accountOneUtopia =  await utopiaToken.balanceOf.call(accounts[1]); // 500 M Tokens
            assert.strictEqual(accountOneUtopia.toString(), "50000000000000000", "Utopia tokens not received after finalization by Accounts[1]")
            var accountOneUtopiaRemaining =  BigInt(await utopiaPresale.purchasedBnb(accounts[1])).toString()
            assert.strictEqual(accountOneUtopiaRemaining, "0", "Utopia tokens balanced not reduced after they have been withdrawn")

            await utopiaPresale.withdrawTokens({from: accounts[2]})
            var accountTwoUtopia =  await utopiaToken.balanceOf.call(accounts[2]); // 500 M Tokens
            assert.strictEqual(accountTwoUtopia.toString(), "50000000000000000", "Utopia tokens not received after finalization by Accounts[2]")
            var accountTwoUtopiaRemaining =  BigInt(await utopiaPresale.purchasedBnb(accounts[2])).toString()
            assert.strictEqual(accountTwoUtopiaRemaining, "0", "Utopia tokens balanced not reduced after they have been withdrawn")
        })
    })

    contract ("Presale but reached hard cap", accounts => {
        it('Should deploy smart contract properly', async () => {
            assert.notDeepEqual(utopiaPresale.address, '', "Unable to retrieve address for Presale");
        })
        it('Should be able to exclude the presale contract from taxes', async () => {
            await utopiaToken.excludeFromFee(utopiaPresale.address);
            var result = await utopiaToken.isExcludedFromFee(utopiaPresale.address);
            assert.isTrue(result, "Unable to exclude presale smart contract from taxes")
        })
        it('Should be able to be send tokens to the smart contract', async() => {
            await utopiaToken.transfer(utopiaPresale.address, BigInt(600000000000000000))  // 6B (0.06% of total supply)
            var presaleUtopiaBalance = await utopiaToken.balanceOf.call(utopiaPresale.address);
            assert.strictEqual(presaleUtopiaBalance.toString(), "600000000000000000", "Unable to transfer tokens to smart contract")
        })
        it('Should be able to be buy tokens', async() => {
            // Note: With a default rate of 1BNB -> 5B UTP, the third account NOT receive any bnb

            // Purchase 1 bnb (5B UTP) worth of tokens from the presale smart contract
            await utopiaPresale.buyTokens(accounts[1], {from: accounts[1], value: "1100000000000000000"})
            var purchaserAddress = await utopiaPresale.purchaserList(0)
            assert.strictEqual(purchaserAddress, accounts[1], "First buyer did not go through") 
            var accounts1PurchasedAmount = BigInt(await utopiaPresale.purchasedBnb(accounts[1])).toString()
            assert.strictEqual(accounts1PurchasedAmount, "1000000000000000000", "First buyer's purchase should be below max purchase value") 

            // Purchase 0.5 bnb (2.5B UTP) worth of tokens from the presale smart contract. Note that acct will only receive remainder 1B (0.2 BNB value)
            await utopiaPresale.buyTokens(accounts[2], {from: accounts[2], value: "500000000000000000"})
            var purchaserAddress = await utopiaPresale.purchaserList(1)
            assert.strictEqual(purchaserAddress, accounts[2], "Second buyer did not go through") 
            var accounts2PurchasedAmount = BigInt(await utopiaPresale.purchasedBnb(accounts[2])).toString()
            assert.strictEqual(accounts2PurchasedAmount, "200000000000000000", "Second buyer's purchase was not recorded")

            // Purchase 0.1 bnb from smart contract but fail since it has reached hard cap (over-subscribed)
            await utopiaPresale.buyTokens(accounts[3], {from: accounts[3], value: "100000000000000000"})
            var accounts3PurchasedUtopiaTokens = BigInt(await utopiaPresale.purchasedBnb(accounts[3])).toString()
            assert.strictEqual(accounts3PurchasedUtopiaTokens, "0", "Third buyer should not go through") 

        })
        it('Additional purchases should not be able to go through', async() => {
            // Purchase 0.5 bnb (2.5B UTP) worth of tokens from the presale smart contract. Note that acct will only receive remainder 2B
            await utopiaPresale.buyTokens(accounts[2], {from: accounts[2], value: "100000000000000000"})
            var accounts2PurchasedAmount = BigInt(await utopiaPresale.purchasedBnb(accounts[2])).toString()
            assert.strictEqual(accounts2PurchasedAmount, "200000000000000000", "Second buyer's purchase changed")
        })
        it('Should be able to be finalized', async() => {
            await utopiaPresale.finalize({from: accounts[0]})
            var finalized = await utopiaPresale.finalized();
            assert.strictEqual(finalized, true, "Unable to finalize smart contract")
        })
        it('Owner should be able to withdraw bnb', async() => {
            var ownerBalanceBeforeReceivingFunds = await web3.eth.getBalance(accounts[0])
            await utopiaPresale.forwardFunds();
            
            var ownerBalanceAfterReceivingFunds = await web3.eth.getBalance(accounts[0])
            assert.isTrue(BigInt(ownerBalanceBeforeReceivingFunds) < BigInt(ownerBalanceAfterReceivingFunds), 
                "Owner's fund before is " + ownerBalanceBeforeReceivingFunds.toString() + 
                " which is less than what it is after at " + ownerBalanceAfterReceivingFunds.toString())
        
        }),
        it('Users should be able to withdraw tokens', async() => { 
            var accountOneUtopiaRemaining =  BigInt(await utopiaPresale.purchasedBnb(accounts[1])).toString()
            assert.strictEqual(accountOneUtopiaRemaining, "1000000000000000000", "Utopia tokens balance should not have changed before withdrawal")
            await utopiaPresale.withdrawTokens({from: accounts[1]})
            var accountOneUtopia =  await utopiaToken.balanceOf.call(accounts[1]); // 5B Tokens
            assert.strictEqual(accountOneUtopia.toString(), "500000000000000000", "Utopia tokens not received after finalization by Accounts[1]")
            var accountOneUtopiaRemaining =  BigInt(await utopiaPresale.purchasedBnb(accounts[1])).toString()
            assert.strictEqual(accountOneUtopiaRemaining, "0", "Utopia tokens balanced not reduced after they have been withdrawn")

            await utopiaPresale.withdrawTokens({from: accounts[2]})
            var accountTwoUtopia =  await utopiaToken.balanceOf.call(accounts[2]); // 500 M Tokens
            assert.strictEqual(accountTwoUtopia.toString(), "100000000000000000", "Utopia tokens not received after finalization by Accounts[2]")
            var accountTwoUtopiaRemaining =  BigInt(await utopiaPresale.purchasedBnb(accounts[2])).toString()
            assert.strictEqual(accountTwoUtopiaRemaining, "0", "Utopia tokens balanced not reduced after they have been withdrawn")
            
            await truffleAssert.reverts(utopiaPresale.withdrawTokens({from: accounts[3]}))
        })
    })
})