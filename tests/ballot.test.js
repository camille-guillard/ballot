import { TestsAccounts } from "remix_tests.sol";

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ballot", function () {

  it("test initial value", async function () {
    const proposalNames = [];
    proposalNames.push("candidate1");
    proposalNames.push("candidate2");
    proposalNames.push("candidate3");

     const [owner, addr1, addr2] = await ethers.getSigners();

    const Ballot = await ethers.getContractFactory("Ballot");
    const ballot = await Ballot.deploy(proposalNames);
    await ballot.deployed();
    console.log("ballot deployed at:" + ballot.address);
    expect((await ballot.chairman())).to.equal(owner.address);
    expect((await ballot.proposals(0))[0]).to.equal("candidate1");
    expect((await ballot.proposals(1))[0]).to.equal("candidate2");
    expect((await ballot.proposals(2))[0]).to.equal("candidate3");
  });
  
});
