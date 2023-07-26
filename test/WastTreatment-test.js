const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const crypto = require('crypto');
const {ethers, deployments, getNamedAccounts, getUnnamedAccounts} = require("hardhat")
const axios = require('axios');

const ENCRYPTION_KEY = 'WbHPUuDNQLpFtSSGiBtTVSeqPdAHBZzw'; // Replace this with your actual encryption key
const IV_LENGTH = 16;
const TOKEN_ID = 1

describe("WastTreatment test", async function () {
  var owner, otherAccount, contract, pinata
  before(async () => {
    await loadFixture(
      deployOneYearLockFixture
    );
  })
 
  async function deployOneYearLockFixture() {
    const pinataSDK = require("@pinata/sdk");
    pinata = new pinataSDK({
      pinataApiKey: "5cf60e7146bc19a4e813",
      pinataSecretApiKey:
        "e0c23a5a169760c651f595778611245375008974b25bd79fc1e8718653cd4780",
    });

    // Contracts are deployed using the first signer/account by default
    const [ownerTemp, otherAccountTemp] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("WastTreatment");
    contract = await Contract.deploy();

    owner = ownerTemp
    otherAccount = otherAccountTemp
  }

  it("Mint NFT", async function () {
    const data = {
      type: "type 1",
      mass: "10 kg",
      senderAddress: "address 1",
      receiverAddress: "address 2",
      sentTime: "time 1",
      receivedTime: "time 2",
    };
    const options = {
      pinataMetadata: {
        name: "metadata.json",
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };
    const dataString = JSON.stringify(data);
    const encryptedData = encrypt(dataString);
    const payload = {
      data: encryptedData
    }
    const { IpfsHash } = await pinata.pinJSONToIPFS(payload, options);
    expect(IpfsHash).to.be.a('string');
    const result = await contract.mint(TOKEN_ID, IpfsHash);
    expect(result).to.be.a('object');
  });

  it("Transfer NFT", async function () {
    const result = await contract.transfer(otherAccount.address, TOKEN_ID);
    expect(result).to.be.a('object');
  });

  it("Get NTF URI and Decrypt it", async function () {
    const tokenURI = await contract.tokenURI(TOKEN_ID);
    expect(tokenURI).to.be.a('string');
    
    
    const fileRes = await axios(`https://maroon-wandering-fly-487.mypinata.cloud/ipfs/${tokenURI}`)
    const fileData = fileRes.data
    expect(fileData).to.be.a('object');

    const decryptedData = JSON.parse(decrypt(fileData.data))
    expect(decryptedData).to.be.a('object');
  });
});

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
}

function decrypt(encryptedText) {
  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText.slice(IV_LENGTH * 2), 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}