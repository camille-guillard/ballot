const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require('@nomicfoundation/hardhat-network-helpers');
const { hashCombined } = require('../utils/hash');

describe("Ballot - Initialization", function () {

    it("should init ballot contract", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
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
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);

        expect((await ballot.voters(addr1.address))["hasVoted"]).to.equal(false);
        expect((await ballot.voters(addr1.address))["revealed"]).to.equal(false);
        expect((await ballot.voters(addr1.address))["delegate"]).to.equal("0x0000000000000000000000000000000000000000");
        expect((await ballot.voters(addr1.address))["weight"]).to.equal(1);
        expect((await ballot.voters(addr1.address))["hashedVotedProposalIndex"]).to.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("should return an error if an user other than the owner try to give the ability to vote", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await expect(ballot.connect(addr1).abilityToVote(addr2.address)).to.be.revertedWithCustomError(ballot, "OwnableUnauthorizedAccount");

    });

    it("should return an error if a unexpected address try to vote", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);
        
        const vote1 = hashCombined(0, "salt1");
        await expect(ballot.connect(addr1).vote(vote1)).to.be.revertedWithCustomError(ballot, "HasNoRightToVote");
    });
});

describe("Ballot - Voting", function () {
    it("should allow users to vote without error", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);

        expect((await ballot.voters(addr1.address))["hasVoted"]).to.equal(false);
        expect((await ballot.voters(addr2.address))["hasVoted"]).to.equal(false);
        expect((await ballot.voters(addr3.address))["hasVoted"]).to.equal(false);
        
        const vote1 = hashCombined(0, "salt1");
        await ballot.connect(addr1).vote(vote1);
        expect((await ballot.voters(addr1.address))["hasVoted"]).to.equal(true);

        const vote2 = hashCombined(1, "salt2");
        await ballot.connect(addr2).vote(vote2);
        expect((await ballot.voters(addr2.address))["hasVoted"]).to.equal(true);

        const vote3 = hashCombined(1, "salt3");
        await ballot.connect(addr3).vote(vote3);
        expect((await ballot.voters(addr3.address))["hasVoted"]).to.equal(true);
    });

    it("should return an error if an user try to vote two times", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        
        const vote1 = hashCombined(0, "salt1");
        await ballot.connect(addr1).vote(vote1);
        await expect(ballot.connect(addr1).vote(vote1)).to.be.revertedWithCustomError(ballot, "AlreadyVoted");
    });

    it("should return an error if an user try to vote after the end of the vote", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        
        // End of the vote
        await time.increase(time.duration.minutes(votingPeriodInMinutes + 1));

        const vote1 = hashCombined(0, "salt1");
        await expect(ballot.connect(addr1).vote(vote1)).to.be.revertedWithCustomError(ballot, "VotingEnded");
    });
});

describe("Ballot - Reveal", function () {
    it("should return candidate2 when the majority of users vote for index 1", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);

        expect((await ballot.voters(addr1.address))["hasVoted"]).to.equal(false);
        expect((await ballot.voters(addr2.address))["hasVoted"]).to.equal(false);
        expect((await ballot.voters(addr3.address))["hasVoted"]).to.equal(false);
        
        const vote1 = hashCombined(0, "salt1");
        await ballot.connect(addr1).vote(vote1);
        expect((await ballot.voters(addr1.address))["hasVoted"]).to.equal(true);

        const vote2 = hashCombined(1, "salt2");
        await ballot.connect(addr2).vote(vote2);
        expect((await ballot.voters(addr2.address))["hasVoted"]).to.equal(true);

        const vote3 = hashCombined(1, "salt3");
        await ballot.connect(addr3).vote(vote3);
        expect((await ballot.voters(addr3.address))["hasVoted"]).to.equal(true);

        // End of the vote
        await time.increase(time.duration.minutes(votingPeriodInMinutes + 1));

        await ballot.connect(addr1).reveal(0, "salt1");
        await ballot.connect(addr2).reveal(1, "salt2");
        await ballot.connect(addr3).reveal(1, "salt3");

        expect((await ballot.winnerProposalName())).to.equal("candidate2");
    });

    it("should return an error if an user try to reveal a wrong vote", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        
        const vote1 = hashCombined(0, "salt1");
        await ballot.connect(addr1).vote(vote1);

        // End of the vote
        await time.increase(time.duration.minutes(votingPeriodInMinutes + 1));

        await expect(ballot.connect(addr1).reveal(1, "salt1")).to.be.revertedWithCustomError(ballot, "InvalidVote");
    });

    it("should return an error if an user try to reveal a wrong salt", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        
        const vote1 = hashCombined(0, "salt1");
        await ballot.connect(addr1).vote(vote1);

        // End of the vote
        await time.increase(time.duration.minutes(votingPeriodInMinutes + 1));

        await expect(ballot.connect(addr1).reveal(0, "wrong_salt")).to.be.revertedWithCustomError(ballot, "InvalidVote");
    });

    it("should return an error if an user try to reveal his vote before the end", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        
        const vote1 = hashCombined(1, "salt1");
        await ballot.connect(addr1).vote(vote1);

        await expect(ballot.connect(addr1).reveal(1, "salt")).to.be.revertedWithCustomError(ballot, "VotingNotEnded");
    });

    it("should return an error if an user try to vote for an unknown proposal", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);
        
        const vote1 = hashCombined(100, "salt1");
        await ballot.connect(addr1).vote(vote1);

        // End of the vote
        await time.increase(time.duration.minutes(votingPeriodInMinutes + 1));

        await expect(ballot.connect(addr1).reveal(100, "salt")).to.be.revertedWithCustomError(ballot, "ProposalDoesNotExist");
    });

    it("should return an error if an user try to reveal his vote two times", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);
        
        const vote1 = hashCombined(1, "salt1");
        await ballot.connect(addr1).vote(vote1);

        // End of the vote
        await time.increase(time.duration.minutes(votingPeriodInMinutes + 1));

        await ballot.connect(addr1).reveal(1, "salt1");
        await expect(ballot.connect(addr1).reveal(1, "salt1")).to.be.revertedWithCustomError(ballot, "AlreadyRevealed");
    });
});

describe("Ballot - Delegation", function () {

    it("should give a weight of 3 to addr3 if addr1 and addr2 delegate their votes to addr3", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);
        
        await ballot.connect(addr1).delegate(addr3.address);
        await ballot.connect(addr2).delegate(addr3.address);

        expect((await ballot.voters(addr1.address))["delegate"]).to.equal(addr3.address);
        expect((await ballot.voters(addr2.address))["delegate"]).to.equal(addr3.address);


        expect((await ballot.voters(addr3.address))["weight"]).to.equal(3);

        const vote1 = hashCombined(1, "salt3");
        await ballot.connect(addr3).vote(vote1);
        
        // End of the vote
        await time.increase(time.duration.minutes(votingPeriodInMinutes + 1));

        await ballot.connect(addr3).reveal(1, "salt3");

        expect((await ballot.proposals(1))["voteCount"]).to.equal(3);
    });

    it("should update the vote of addr3 if addr1 and addr2 delegate their votes after the vote of addr3", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);

        const vote1 = hashCombined(1, "salt3");
        await ballot.connect(addr3).vote(vote1);
        
        await ballot.connect(addr1).delegate(addr3.address);
        await ballot.connect(addr2).delegate(addr3.address);

        // End of the vote
        await time.increase(time.duration.minutes(votingPeriodInMinutes + 1));

        await ballot.connect(addr3).reveal(1, "salt3");

        expect((await ballot.proposals(1))["voteCount"]).to.equal(3);
    });

    it("should return an error if an user try to delegate to himself", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);

        await expect(ballot.connect(addr1).delegate(addr1.address)).to.be.revertedWithCustomError(ballot, "CannotDelegateToYourself");
    });

    it("should return an error if there is a delegation loop", async function () {
        const proposalNames = [];
        proposalNames.push("candidate1");
        proposalNames.push("candidate2");
        proposalNames.push("candidate3");
        const votingPeriodInMinutes = 10;

        const [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Ballot = await ethers.getContractFactory("Ballot");
        const ballot = await Ballot.connect(owner).deploy(proposalNames, votingPeriodInMinutes);
        console.log("ballot deployed at:" + ballot.address);

        await ballot.abilityToVote(addr1.address);
        await ballot.abilityToVote(addr2.address);
        await ballot.abilityToVote(addr3.address);

        await ballot.connect(addr1).delegate(addr3.address);
        await ballot.connect(addr2).delegate(addr3.address);
        await expect(ballot.connect(addr3).delegate(addr1.address)).to.be.revertedWithCustomError(ballot, "CannotDelegateToYourself");
    });

});
