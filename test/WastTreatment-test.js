const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Lock", function () {
  // let lock;

  // beforeEach(async function () {
  //   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  //   unlockTime = (await helpers.time.latest()) + ONE_YEAR_IN_SECS;

  //   const Lock = await ethers.getContractFactory("Lock");
  //   lock = await Lock.deploy(unlockTime, { value: lockedAmount });
  // });

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const pinataSDK = require("@pinata/sdk");
    const pinata = new pinataSDK({
      pinataApiKey: "5cf60e7146bc19a4e813",
      pinataSecretApiKey:
        "e0c23a5a169760c651f595778611245375008974b25bd79fc1e8718653cd4780",
    });

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const WastTreatment = await ethers.getContractFactory("WastTreatment");
    const wastTreatment = await WastTreatment.deploy();

    return { owner, otherAccount, wastTreatment, pinata };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { owner, otherAccount, wastTreatment, pinata } = await loadFixture(
        deployOneYearLockFixture
      );

      const body = {
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
      const { IpfsHash } = await pinata.pinJSONToIPFS(body, options);

      console.log("CID", IpfsHash);
    });
  });
});
