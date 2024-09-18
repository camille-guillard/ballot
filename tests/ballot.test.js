const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ballot - Initialization", function () {

    it("should init ballot contract", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);
        expect((await ballot.chairman())).to.equal(owner.address);
        expect((await ballot.proposals(0))["name"]).to.equal("candidate1");
        expect((await ballot.proposals(0))["voteCount"]).to.equal(0);
        expect((await ballot.proposals(1))["name"]).to.equal("candidate2");
        expect((await ballot.proposals(1))["voteCount"]).to.equal(0);
        expect((await ballot.proposals(2))["name"]).to.equal("candidate3");
        expect((await ballot.proposals(2))["voteCount"]).to.equal(0);

        expect((await ballot.voters(addr1.address))["weight"]).to.equal(0);
        expect((await ballot.voters(addr2.address))["weight"]).to.equal(0);
        expect((await ballot.voters(addr3.address))["weight"]).to.equal(0);
    });
  
});

describe("Ballot - Authorization", function () {

    it("should return a voter with height equals to 1 when the owner authorize the address oh the voter", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);

        expect((await ballot.voters(addr1.address))["hasVoted"]).to.equal(false);
        expect((await ballot.voters(addr1.address))["delegate"]).to.equal("0x0000000000000000000000000000000000000000");
        expect((await ballot.voters(addr1.address))["weight"]).to.equal(1);
        expect((await ballot.voters(addr1.address))["votedProposal"]).to.equal("0x0000000000000000000000000000000000000000");
    });

});


describe("Ballot - Voting", function () {
    it("should return candidate2 when the majority of users vote for index 1", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);

        expect((await ballot.voters(addr1.address))["hasVoted"]).to.equal(false);
        expect((await ballot.voters(addr2.address))["hasVoted"]).to.equal(false);
        expect((await ballot.voters(addr3.address))["hasVoted"]).to.equal(false);
        
        await ballot.connect(addr1).vote(0);
        expect((await ballot.voters(addr1.address))["hasVoted"]).to.equal(true);
        expect((await ballot.voters(addr1.address))["votedProposal"]).to.equal(0);

        await ballot.connect(addr2).vote(1);
        expect((await ballot.voters(addr2.address))["hasVoted"]).to.equal(true);
        expect((await ballot.voters(addr2.address))["votedProposal"]).to.equal(1);

        await ballot.connect(addr3).vote(1);
        expect((await ballot.voters(addr3.address))["hasVoted"]).to.equal(true);
        expect((await ballot.voters(addr3.address))["votedProposal"]).to.equal(1);

        expect((await ballot.winningProposal())).to.equal(1);
        expect((await ballot.winnerProposalName())).to.equal("candidate2");
    });

    it("should return an error if an user try to vote two times", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        
        await ballot.connect(addr1).vote(0);
        await expect(ballot.connect(addr1).vote(0)).to.be.revertedWith("Already voted!");

    });

    it("should return an error if an user try to vote for an unknown proposal", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);
        
        await expect(ballot.connect(addr1).vote(1000)).to.be.revertedWith("The proposal does not exist!");
    });

    it("should return an error if a unexpected address try to vote", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);
        
        await expect(ballot.connect(addr1).vote(1)).to.be.revertedWith("Has no right to vote!");
    });
});

describe("Ballot - Delegation", function () {

    it("should give a weight of 3 to addr3 if addr1 and addr2 delegate their votes to addr3", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);
        
        await ballot.connect(addr1).delegate(addr3.address);
        await ballot.connect(addr2).delegate(addr3.address);

        expect((await ballot.voters(addr1.address))["delegate"]).to.equal(addr3.address);
        expect((await ballot.voters(addr2.address))["delegate"]).to.equal(addr3.address);


        expect((await ballot.voters(addr3.address))["weight"]).to.equal(3);

        await ballot.connect(addr3).vote(1);

        expect((await ballot.proposals(1))["voteCount"]).to.equal(3);
    });

    it("should update the vote of addr3 if addr1 and addr2 delegate their votes after the vote of addr3", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);

        await ballot.connect(addr3).vote(1);
        
        await ballot.connect(addr1).delegate(addr3.address);
        await ballot.connect(addr2).delegate(addr3.address);

        expect((await ballot.proposals(1))["voteCount"]).to.equal(3);
    });

    it("should return an error if an user try to delegate to himself", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);

        await expect(ballot.connect(addr1).delegate(addr1.address)).to.be.revertedWith("You can't delegate to yourself!");
    });

    it("should return an error if there is a delegation loop", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);

        await ballot.connect(addr1).delegate(addr3.address);
        await ballot.connect(addr2).delegate(addr3.address);
        await expect(ballot.connect(addr3).delegate(addr1.address)).to.be.revertedWith("You can't delegate to yourself!");
    });

});
