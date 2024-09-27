// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BallotModule", (m) => {
  const proposalNames = m.getParameter("proposalNames", []);
  const votingPeriodInMinutes = m.getParameter("votingPeriodInMinutes", 10);

  const ballotContract = m.contract("Ballot", [proposalNames, votingPeriodInMinutes], { id: "artemis" });

  console.log("Contract deployed address : " + ballotContract.address);

  return { ballotContract };
});