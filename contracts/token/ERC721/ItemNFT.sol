// SPDX-FileCopyrightText: 2023 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// ItemNFT features
//  - ERC721 basic functions
//  - configurable for burnable (defined at construction)
//  - defense for transferring tokens to the token contract itself
contract ItemNFT is
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable2Step
{
    bool public immutable burnable;
    mapping(address => bool) public burnApprovals;
    mapping(address => bool) public mintApprovals;
    string public baseURI;

    event BurnApproval(address indexed burner, bool indexed approved);

    event MintApproval(address indexed minter, bool indexed approved);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory uri_,
        bool burnable_
    ) ERC721(name_, symbol_) {
        setBaseURI(uri_);
        burnable = burnable_;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    modifier whenBurnableEnabled() {
        require(burnable, "ItemNFT: the token is not burnable");
        _;
    }

    modifier hasBurnPermission() {
        require(
            _msgSender() == owner() || burnApprovals[_msgSender()],
            "ItemNFT: the sender does not have permission to burn"
        );
        _;
    }

    modifier hasMintPermission() {
        require(
            _msgSender() == owner() || mintApprovals[_msgSender()],
            "ItemNFT: the sender does not have permission to mint"
        );
        _;
    }

    function safeMint(address to, uint256 tokenId) public hasMintPermission {
        _safeMint(to, tokenId);
    }

    function safeMintBatch(address to, uint256[] calldata tokenIds)
        public
        hasMintPermission
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _safeMint(to, tokenIds[i]);
        }
    }

    function burn(uint256 tokenId)
        public
        override
        whenBurnableEnabled
        hasBurnPermission
    {
        super.burn(tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function setBurnApproval(address burner, bool approved)
        external
        onlyOwner
        whenBurnableEnabled
    {
        burnApprovals[burner] = approved;
        emit BurnApproval(burner, approved);
    }

    function setMintApproval(address minter, bool approved) external onlyOwner {
        mintApprovals[minter] = approved;
        emit MintApproval(minter, approved);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI)
        public
        onlyOwner
    {
        _setTokenURI(tokenId, _tokenURI);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory uri_) public onlyOwner {
        baseURI = uri_;
    }

    function _beforeTokenTransfer(
        address,
        address to,
        uint256,
        uint256
    ) internal view override(ERC721, ERC721Enumerable) {
        require(
            to != address(this),
            "ItemNFT: cannot transfer tokens to the token contract itself"
        );
    }
}
