var UtopiaAuthenticator = artifacts.require("UtopiaAuthenticator");
var UtopiaToken = artifacts.require("UtopiaToken");
var UtopiaPresale = artifacts.require("UtopiaPresale");

module.exports = async function(deployer) {
    // await deployer.deploy(UtopiaAuthenticator);
    // let utopiaAuthenticator = await UtopiaAuthenticator.deployed()

    // console.log(utopiaAuthenticator.address);

    // await deployer.deploy(UtopiaToken, utopiaAuthenticator.address);

    await deployer.deploy(UtopiaToken, "0x6B9d5ab88108b517225c757976eb122D85617b7E");
    // await deployer.deploy(UtopiaToken);
    let token = await UtopiaToken.deployed()

    console.log(token.address);

    // Thats max 1 BNB per address
    // Rate: 500 BNB -> 30T UTP (30% of total supply)
    // Rate: 1BNB -> 60B UTP
    // await deployer.deploy(UtopiaPresale, 600000000, "0x1a1d7c7A92e8d7f0de10Ae532ECD9f63B7EAf67c", 1632945600) // Enable in prod for actual launch
    // // Rate: 0.01 BNB -> 60B UTP
    // // await deployer.deploy(UtopiaPresale, 60000000000, token.address, 1620958382) // For testing
    // let presale = await UtopiaPresale.deployed();
    // // console.log(token.address)
    // console.log(presale.address);
};