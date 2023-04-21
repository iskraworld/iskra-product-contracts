// SPDX-FileCopyrightText: 2023 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/interfaces/IERC1363.sol";
import "@openzeppelin/contracts/interfaces/IERC1363Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

// UtilityToken features
//  - ERC20 basic functions
//  - unlimited supply
//  - mintable, burnable
//  - IERC1363Receiver feature
//  - defense for transferring tokens to the token contract itself
contract UtilityToken is IERC20Metadata, IERC1363, ERC20Burnable, Ownable2Step {
    using Address for address;

    mapping(address => bool) public minters;

    event MinterAdded(address indexed newMinter);
    event MinterRemoved(address indexed minter);

    constructor(
        string memory _name,
        string memory _symbol,
        address firstMinter
    ) ERC20(_name, _symbol) {
        addMinter(firstMinter);
    }

    modifier onlyMinter() {
        require(minters[msg.sender], "UtilityToken: caller is not a minter");
        _;
    }

    function supportsInterface(bytes4 interfaceId)
        external
        pure
        override
        returns (bool)
    {
        return
            interfaceId == type(IERC20Metadata).interfaceId ||
            interfaceId == type(IERC1363).interfaceId ||
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC20).interfaceId;
    }

    function addMinter(address newMinter) public onlyOwner {
        require(newMinter != address(0), "invalid address");
        require(
            !minters[newMinter],
            "UtilityToken: newMinter is already a minter"
        );

        minters[newMinter] = true;
        emit MinterAdded(newMinter);
    }

    function removeMinter(address minter) public onlyOwner {
        require(minters[minter], "UtilityToken: given minter is not a minter");
        minters[minter] = false;

        emit MinterRemoved(minter);
    }

    function mint(address to, uint256 amount) public onlyMinter {
        _mint(to, amount);
    }

    function burn(uint256 amount) public override onlyMinter {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount)
        public
        override
        onlyMinter
    {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    function transferAndCall(address recipient, uint256 amount)
        public
        override
        returns (bool)
    {
        return transferAndCall(recipient, amount, "");
    }

    function transferAndCall(
        address recipient,
        uint256 amount,
        bytes memory data
    ) public override returns (bool) {
        transfer(recipient, amount);
        require(
            _checkOnTransferReceived(_msgSender(), recipient, amount, data),
            "UtilityToken: _checkAndCallTransfer reverts"
        );
        return true;
    }

    function transferFromAndCall(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        return transferFromAndCall(sender, recipient, amount, "");
    }

    function transferFromAndCall(
        address sender,
        address recipient,
        uint256 amount,
        bytes memory data
    ) public override returns (bool) {
        transferFrom(sender, recipient, amount);
        require(
            _checkOnTransferReceived(sender, recipient, amount, data),
            "UtilityToken: _checkAndCallTransfer reverts"
        );
        return true;
    }

    function approveAndCall(address, uint256)
        external
        pure
        override
        returns (bool)
    {
        require(
            false,
            "UtilityToken: does not support approveAndCall due to security issue of approve"
        );

        return false;
    }

    function approveAndCall(
        address,
        uint256,
        bytes memory
    ) external pure override returns (bool) {
        require(
            false,
            "UtilityToken: does not support approveAndCall due to security issue of approve"
        );

        return false;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(
            to != address(this),
            "UtilityToken: cannot transfer tokens to the token contract"
        );
        super._beforeTokenTransfer(from, to, amount);
    }

    function _checkOnTransferReceived(
        address sender,
        address recipient,
        uint256 amount,
        bytes memory data
    ) internal returns (bool) {
        if (!recipient.isContract()) {
            return false;
        }

        bytes4 retval = IERC1363Receiver(recipient).onTransferReceived(
            _msgSender(),
            sender,
            amount,
            data
        );
        return (retval ==
            IERC1363Receiver(recipient).onTransferReceived.selector);
    }
}
