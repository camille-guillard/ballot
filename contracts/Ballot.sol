// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.27;

import "hardhat/console.sol";


contract Ballot {

    address public chairman;

    struct Voter {
        bool hasVoted;
        address delegate;
        uint weight;
        uint votedProposal;
    }

    struct Proposal {
        string name;
        uint voteCount;
    }

    Proposal[] public proposals;

    mapping(address => Voter) public voters;

    constructor(string[] memory proposalNames) {
        chairman = msg.sender;
        voters[chairman].weight = 1;

        for (uint i = 0; i < proposalNames.length; i++) {

            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }

    function vote(uint proposalIndex)  external {
        Voter storage sender = voters[msg.sender];
        
        require(!sender.hasVoted, "Already voted!");
        require(sender.weight > 0, "Has no right to vote!");
        require(proposalIndex < proposals.length, "The proposal does not exist!");
        sender.hasVoted = true;    
        sender.votedProposal = proposalIndex; 

        proposals[proposalIndex].voteCount += sender.weight;
    }

    function abilityToVote(address voter) public {
        require(msg.sender == chairman, "Only the chairman can give the ability to vote!");
        require(!voters[voter].hasVoted, "The voter has already voted!");
        require(voters[voter].weight == 0, "The voter can already vote!");
        voters[voter].weight = 1;
    }

    function winningProposal() public view returns ( uint winningProposalIndex) {
        uint winningVoteCount = 0;
        for(uint i=0; i < proposals.length; i++) {
            if(proposals[i].voteCount > winningVoteCount) {
                winningVoteCount = proposals[i].voteCount;
                winningProposalIndex = i;
            }
        }
    }

    function delegate(address delegateAddress) external {
        Voter storage voter = voters[msg.sender];
        require(!voter.hasVoted, "You have already voted!");
        require(delegateAddress != msg.sender, "You can't delegate to yourself!");

        while(voters[delegateAddress].delegate != address(0)) {
            delegateAddress = voters[delegateAddress].delegate;
            require(delegateAddress != msg.sender, "You can't delegate to yourself!");
        }

        voter.hasVoted = true;
        voter.delegate = delegateAddress;
        Voter storage delegateVoter = voters[delegateAddress];
        if(delegateVoter.hasVoted) {
            proposals[delegateVoter.votedProposal].voteCount += voter.weight;
        } else {
            delegateVoter.weight += voter.weight;
        }
    }

    function winnerProposalName() public view returns(string memory winnerName) {
        winnerName = proposals[winningProposal()].name;
    }

}