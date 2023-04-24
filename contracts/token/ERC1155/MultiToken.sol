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

    event ApprovalBurnPermission(
        address indexed newBurner,
        bool indexed approved
    );
    mapping(address => bool) public burnApprovals;
    // NOTE:
    // Having a single name is not appropriate for the original ERC1155.
    // However, we added it because most network explorers refer to this field to expose token information.
    string public name;

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

    function setURI(uint256 tokenId, string memory tokenURI_) public onlyOwner {
        _setURI(tokenId, tokenURI_);
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
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
            msg.sender == owner() || burnApprovals[msg.sender],
            "MultiToken: msg.sender does not have permission to burn"
        );
        _;
    }

    function pause() external whenPausableEnabled onlyOwner {
        _pause();
    }

    function unpause() external whenPausableEnabled onlyOwner {
        _unpause();
    }

    function setApprovalBurnPermission(address burner, bool approved)
        external
        onlyOwner
        whenBurnableEnabled
        whenNotPaused
    {
        burnApprovals[burner] = approved;
        emit ApprovalBurnPermission(burner, approved);
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
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
        uint256[] memory ids,
        uint256[] memory values
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
