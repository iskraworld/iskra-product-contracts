// SPDX-FileCopyrightText: 2023 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "./extensions/ERC721Snapshot.sol";

// ERC721Snapshot features
//  - ERC721 basic functions
//  - Snapshot account balances and token owners at everyday 00:00:00 UTC
//  - configurable for burnable (defined at construction)
//  - defense for transferring tokens to the token contract itself
contract ItemNFTSnapshot is
    ERC721Snapshot,
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
        require(burnable, "ItemNFTSnapshot: the token is not burnable");
        _;
    }

    modifier hasBurnPermission() {
        require(
            _msgSender() == owner() || burnApprovals[_msgSender()],
            "ItemNFTSnapshot: the sender does not have permission to burn"
        );
        _;
    }

    modifier hasMintPermission() {
        require(
            _msgSender() == owner() || mintApprovals[_msgSender()],
            "ItemNFTSnapshot: the sender does not have permission to mint"
        );
        _;
    }

    modifier checkTimestamp(uint256 timestamp) {
        require(
            timestamp <= block.timestamp,
            "ItemNFTSnapshot: cannot query snapshots for future times"
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

    function setTokenURI(uint256 tokenId, string calldata _tokenURI)
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

    function _getCurrentSnapshotId() internal view override returns (uint256) {
        return block.timestamp / 24 hours;
    }

    function balanceOfAt(address account, uint256 timestamp)
        public
        view
        override
        checkTimestamp(timestamp)
        returns (uint256)
    {
        uint256 snapshotId = timestamp / 24 hours;
        return super.balanceOfAt(account, snapshotId);
    }

    function ownerOfAt(uint256 tokenId, uint256 timestamp)
        public
        view
        override
        checkTimestamp(timestamp)
        returns (address)
    {
        uint256 snapshotId = timestamp / 24 hours;
        return super.ownerOfAt(tokenId, snapshotId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Snapshot, ERC721Enumerable) {
        require(
            to != address(this),
            "ItemNFTSnapshot: cannot transfer tokens to the token contract itself"
        );
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }
}
