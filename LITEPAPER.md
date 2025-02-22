# Litepaper


## Project introduction

This project is an implementation of a voting session on the blockchain by using a smart contract on Ethereum.
The owner of the smart contract can create a vote beetween mutiple proposal for several participants.
Each user registed by the owner can vote beetween the proposals.
A user can also delegate his vote to another user.
At the end of the vote, the owner can retrieve the result of the vote.


## Outline of the problem

Organazing a vote can be very complicated, because the voting system must guarantee user confidence.
Votes are most often carried out physically at a polling station because centralized softwares whose code cannot be read are not transparent enough for voters.
It is mandatory to go to the polling station to be able to vote, or to provide a signed document to a person if you wish to delegate the vote.
Finally, at the end of the vote, counting the ballots can be very energy-intensive for all volunteers, especially if the vote is on the scale of a country.


## How does it work ?

The chairman must init the voting session with a list of proposals during the deployment of the contrat.
Then, he has to authorize users by entering their public keys.
Only this list of users will be able to vote for a proposal.

After that, all the selected users can check the list of proposals.
Then they can vote by entering the index of the selected proposal.
An user can also delegate his vote to another one, that mean the second user will be able to vote in his name.
To delegate, an user have to enter the public address of the other user than he wish to delegate.

At the end of the session, the result of the vote can be retrive from the blockchain from a public fonction.


## Moat & Value Capture

First of all, it removes the default of voting physically at the polling station.
The result of the vote is automatically and instantly calculated by the smart contract, no need to count the ballots physically.
Moreover, you can also vote remotely from everywhere around the world or delegate your vote to another user on the other side of the world.

Secondly, this mode of operation prevents of cheating.
It is possible to solve the problems of the first point with by using a classic web2 software.
But we cannot know whether or not the code or the database have been altered by cheating during the vote.


## Conclusion

The blockchain provides a climate of trust because the code of the smart contract is public, so everyone can check it to verify it.