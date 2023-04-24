// SPDX-FileCopyrightText: 2023 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

// ItemNFT features
//  - ERC721 basic functions
contract ItemNFT is ERC721, Ownable2Step {
    string internal mBaseURI = "";

    constructor(
        string memory name_,
        string memory symbol_,
        string memory uri_
    ) ERC721(name_, symbol_) {
        setBaseURI(uri_);
    }

    function mint(address to, uint256 tokenId) public onlyOwner {
        _mint(to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return mBaseURI;
    }

    function setBaseURI(string memory _uri) public onlyOwner {
        mBaseURI = _uri;
    }
}
