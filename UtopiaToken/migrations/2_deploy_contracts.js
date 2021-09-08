var UtopiaToken = artifacts.require("UtopiaToken");
var UtopiaPresale = artifacts.require("UtopiaPresale");

module.exports = async function(deployer) {
    await deployer.deploy(UtopiaToken);
    let token = await UtopiaToken.deployed()

    // Thats max 1 BNB per address
    // Rate: 1BNB -> 5B UTP
    // Rate: 1BNB -> 583.33... Million UTP
    await deployer.deploy(UtopiaPresale, 583333333, token.address, 1620958382)
    let presale = await UtopiaPresale.deployed();
    console.log(token.address)
    console.log(presale.address);
};