// SPDX-FileCopyrightText: 2023 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC1363Receiver.sol";

contract ERC1363Receiver is IERC1363Receiver {
    event OnReceived(
        address token,
        address operator,
        address from,
        uint256 amount,
        bytes data
    );

    function onTransferReceived(
        address operator,
        address from,
        uint256 amount,
        bytes memory data
    ) external override returns (bytes4) {
        emit OnReceived(msg.sender, operator, from, amount, data);
        return IERC1363Receiver(this).onTransferReceived.selector;
    }
}

contract ERC1363ReceiverInvalidReturn is IERC1363Receiver {
    event OnReceived(
        address token,
        address operator,
        address from,
        uint256 amount,
        bytes data
    );

    function onTransferReceived(
        address operator,
        address from,
        uint256 amount,
        bytes memory data
    ) external override returns (bytes4) {
        emit OnReceived(msg.sender, operator, from, amount, data);
        return 0x0;
    }
}

contract ERC1363ReceiverMissingParam {
    bytes4 private constant _ERC1363_RECEIVED = 0x88a7ca5c;

    event OnReceived(
        address token,
        address operator,
        address from,
        uint256 amount,
        bytes data
    );

    function onTransferReceived(
        address operator,
        address from,
        uint256 amount
    ) external returns (bytes4) {
        emit OnReceived(msg.sender, operator, from, amount, "");
        return _ERC1363_RECEIVED;
    }
}
