// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract OFTPermit is OFT, ERC20Permit {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    )
        OFT(_name, _symbol, _lzEndpoint, _delegate)
        ERC20Permit(_name) // solhint-disable-next-line no-empty-blocks
    {}
}
