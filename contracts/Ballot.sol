// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.27;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ballot is Ownable {

    address public chairman;

    uint8 winnerIndex = 0;
    uint256 highestVotes = 0;
    uint256 public immutable votingStart;
    uint256 public immutable votingEnd;

    error AlreadyVoted();
    error AlreadyRevealed();
    error ProposalDoesNotExist();
    error HasNoRightToVote();
    error CannotDelegateToYourself();
    error VotingNotStarted();
    error VotingEnded();
    error VotingNotEnded();
    error InvalidVote();

    event AbilityToVote(address indexed voter);
    event VoteCommitted(address indexed voter, bytes32 indexed hash);
    event VoteRevealed(address indexed voter, bytes32 voteHash);
    event WinnerUpdated(bytes32 newWinnerHash);

    struct Voter {
        bool hasVoted;
        bool revealed;
        address delegate;
        uint weight;
        bytes32 hashedVotedProposalIndex;
    }

    struct Proposal {
        string name;
        uint voteCount;
    }

    Proposal[] public proposals;

    mapping(address => Voter) public voters;

    constructor(string[] memory proposalNames, uint256 _votingPeriodInMinutes) Ownable(msg.sender) {
        chairman = msg.sender;
        voters[chairman].weight = 1;

        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }

        votingStart = block.timestamp;
        votingEnd = votingStart + (_votingPeriodInMinutes * 1 minutes);
    }

    function vote(bytes32 _hashedVotedProposalIndex)  external {
        Voter storage sender = voters[msg.sender];
        require(!sender.hasVoted, AlreadyVoted());
        require(block.timestamp > votingStart,  VotingNotStarted());
        require(block.timestamp < votingEnd, VotingEnded());
        require(sender.weight > 0, HasNoRightToVote());

        sender.hasVoted = true;
        sender.hashedVotedProposalIndex = _hashedVotedProposalIndex; 

        emit VoteCommitted(msg.sender, _hashedVotedProposalIndex);
    }

    function reveal(uint8 _votedProposalIndex, string calldata _salt) external {
        Voter storage sender = voters[msg.sender];

        require(block.timestamp > votingEnd, VotingNotEnded());
        require(_votedProposalIndex < proposals.length, ProposalDoesNotExist());

        bytes32 voteHash = keccak256(abi.encodePacked(Strings.toString(_votedProposalIndex) , _salt));
        require(!sender.revealed, AlreadyRevealed());
        require(sender.hashedVotedProposalIndex == voteHash, InvalidVote());

        sender.revealed = true;
        proposals[_votedProposalIndex].voteCount += sender.weight;

        if (proposals[_votedProposalIndex].voteCount > highestVotes) {
            highestVotes = proposals[_votedProposalIndex].voteCount;
            winnerIndex = _votedProposalIndex;
            emit WinnerUpdated(voteHash);
        }

        emit VoteRevealed(msg.sender, voteHash);
    }

    function abilityToVote(address voter) public onlyOwner {
        require(!voters[voter].hasVoted, AlreadyVoted());
        require(voters[voter].weight == 0, AlreadyVoted());
        voters[voter].weight = 1;

        emit AbilityToVote(voter);
    }

    function delegate(address delegateAddress) external {
        Voter storage voter = voters[msg.sender];
        require(!voter.hasVoted, AlreadyVoted());
        require(delegateAddress != msg.sender, CannotDelegateToYourself());

        while(voters[delegateAddress].delegate != address(0)) {
            delegateAddress = voters[delegateAddress].delegate;
            require(delegateAddress != msg.sender, CannotDelegateToYourself());
        }

        voter.hasVoted = true;
        voter.delegate = delegateAddress;
        Voter storage delegateVoter = voters[delegateAddress];
        delegateVoter.weight += voter.weight;
    }

    function winnerProposalName() public view returns(string memory winnerName) {
        require(block.timestamp > votingEnd, VotingNotEnded());
        winnerName = proposals[winnerIndex].name;
    }

}