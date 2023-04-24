// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract ERC721Receiver is IERC721Receiver {
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

    event OnReceived(
        address operator,
        address from,
        uint256 tokenId,
        bytes data
    );

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) external override returns (bytes4) {
        emit OnReceived(operator, from, tokenId, data);
        return _ERC721_RECEIVED;
    }
}

contract ERC721ReceiverInvalidReturn is IERC721Receiver {
    event OnReceived(
        address operator,
        address from,
        uint256 tokenId,
        bytes data
    );

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) external override returns (bytes4) {
        emit OnReceived(operator, from, tokenId, data);
        return 0x0;
    }
}

contract ERC721ReceiverMissingParam {
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

    event OnReceived(
        address operator,
        address from,
        uint256 tokenId,
        bytes data
    );

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId
    ) external returns (bytes4) {
        emit OnReceived(operator, from, tokenId, "");
        return _ERC721_RECEIVED;
    }
}
