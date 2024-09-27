const { keccak256 } = require('js-sha3');

function hashCombined(value, secret) {
	return '0x' + keccak256(value + secret);
};

module.exports = { hashCombined };