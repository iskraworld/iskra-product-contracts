// SPDX-FileCopyrightText: 2022 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

// MultiToken features
//  - ERC1155 basic functions
//  - configurable for pausable, burnable (defined at construction)
//  - defense for transferring tokens to the token contract itself
contract MultiToken is
    ERC1155URIStorage,
    Ownable2Step,
    Pausable,
    ERC1155Burnable,
    ERC1155Supply
{
    bool public immutable pausable;
    bool public immutable burnable;

    mapping(address => bool) public burnApprovals;
    mapping(address => bool) public mintApprovals;

    // NOTE:
    // Having a single name is not appropriate for the original ERC1155.
    // However, we added it because most network explorers refer to this field to expose token information.
    string public name;

    event BurnApproval(address indexed burner, bool indexed approved);

    event MintApproval(address indexed minter, bool indexed approved);

    constructor(
        string memory uri_,
        string memory name_,
        bool pausable_,
        bool burnable_
    ) ERC1155(uri_) {
        name = name_;
        pausable = pausable_;
        burnable = burnable_;
    }

    function uri(uint256 tokenId)
        public
        view
        virtual
        override(ERC1155, ERC1155URIStorage)
        returns (string memory)
    {
        return ERC1155URIStorage.uri(tokenId);
    }

    function setURI(uint256 tokenId, string calldata tokenURI_)
        public
        onlyOwner
    {
        _setURI(tokenId, tokenURI_);
    }

    function setBaseURI(string calldata baseURI) public onlyOwner {
        _setBaseURI(baseURI);
    }

    modifier whenPausableEnabled() {
        require(pausable, "MultiToken: pausable is disabled");
        _;
    }

    modifier whenBurnableEnabled() {
        require(burnable, "MultiToken: burnable is disabled");
        _;
    }

    modifier hasBurnPermission() {
        require(
            _msgSender() == owner() || burnApprovals[_msgSender()],
            "MultiToken: the sender does not have permission to burn"
        );
        _;
    }

    modifier hasMintPermission() {
        require(
            _msgSender() == owner() || mintApprovals[_msgSender()],
            "MultiToken: the sender does not have permission to mint"
        );
        _;
    }

    function pause() external whenPausableEnabled onlyOwner {
        _pause();
    }

    function unpause() external whenPausableEnabled onlyOwner {
        _unpause();
    }

    function setBurnApproval(address burner, bool approved)
        external
        onlyOwner
        whenBurnableEnabled
        whenNotPaused
    {
        burnApprovals[burner] = approved;
        emit BurnApproval(burner, approved);
    }

    function setMintApproval(address minter, bool approved)
        external
        onlyOwner
        whenNotPaused
    {
        mintApprovals[minter] = approved;
        emit MintApproval(minter, approved);
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) public hasMintPermission {
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) public hasMintPermission {
        _mintBatch(to, ids, amounts, data);
    }

    function burn(
        address account,
        uint256 id,
        uint256 value
    ) public override whenBurnableEnabled hasBurnPermission {
        super.burn(account, id, value);
    }

    function burnBatch(
        address account,
        uint256[] calldata ids,
        uint256[] calldata values
    ) public override whenBurnableEnabled hasBurnPermission {
        super.burnBatch(account, ids, values);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        require(
            to != address(this),
            "cannot transfer tokens to the token contract itself"
        );
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155)
        returns (bool)
    {
        return ERC1155.supportsInterface(interfaceId);
    }
}
