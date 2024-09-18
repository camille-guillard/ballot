// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BallotModule", (m) => {
  const proposalNames = m.getParameter("proposalNames", []);

  const ballot = m.contract("Ballot", [proposalNames]);

  return { ballot };
});