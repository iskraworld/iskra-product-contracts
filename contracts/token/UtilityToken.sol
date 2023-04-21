// SPDX-FileCopyrightText: 2023 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "../kip/IKIP13.sol";
import "../kip/IKIP7.sol";
import "../kip/IKIP7Metadata.sol";
import "../kip/IKIP7Receiver.sol";

// UtilityToken features
//  - ERC20 basic functions
//  - unlimited supply
//  - mintable, burnable
//  - defense for transferring tokens to the token contract itself
contract UtilityToken is
    IKIP13,
    IKIP7,
    IKIP7Metadata,
    IERC165,
    ERC20Burnable,
    Ownable2Step
{
    using Address for address;

    bytes4 private constant _KIP7_RECEIVED = 0x9d188c22;

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
        require(minters[msg.sender], "caller is not a minter");
        _;
    }

    function supportsInterface(bytes4 interfaceId)
        external
        pure
        override(IKIP13, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IKIP13).interfaceId ||
            interfaceId == type(IKIP7).interfaceId ||
            interfaceId == type(IKIP7Metadata).interfaceId ||
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC20).interfaceId;
    }

    function addMinter(address newMinter) public onlyOwner {
        require(newMinter != address(0), "invalid address");
        require(!minters[newMinter], "newMinter is already a minter");

        minters[newMinter] = true;
        emit MinterAdded(newMinter);
    }

    function removeMinter(address minter) public onlyOwner {
        require(minters[minter], "given minter is not a minter");
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

    function name()
        public
        view
        override(IKIP7Metadata, ERC20)
        returns (string memory)
    {
        return super.name();
    }

    function symbol()
        public
        view
        override(IKIP7Metadata, ERC20)
        returns (string memory)
    {
        return super.symbol();
    }

    function decimals()
        public
        view
        override(IKIP7Metadata, ERC20)
        returns (uint8)
    {
        return super.decimals();
    }

    function totalSupply()
        public
        view
        override(IKIP7, ERC20)
        returns (uint256)
    {
        return super.totalSupply();
    }

    function balanceOf(address account)
        public
        view
        override(IKIP7, ERC20)
        returns (uint256)
    {
        return super.balanceOf(account);
    }

    function transfer(address recipient, uint256 amount)
        public
        override(IKIP7, ERC20)
        returns (bool)
    {
        return super.transfer(recipient, amount);
    }

    function allowance(address owner, address spender)
        public
        view
        override(IKIP7, ERC20)
        returns (uint256)
    {
        return super.allowance(owner, spender);
    }

    function approve(address spender, uint256 amount)
        public
        override(IKIP7, ERC20)
        returns (bool)
    {
        return super.approve(spender, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override(IKIP7, ERC20) returns (bool) {
        return super.transferFrom(sender, recipient, amount);
    }

    function safeTransfer(
        address recipient,
        uint256 amount,
        bytes memory data
    ) external override {
        _safeTransfer(recipient, amount, data);
    }

    function safeTransfer(address recipient, uint256 amount) external override {
        _safeTransfer(recipient, amount, "");
    }

    function safeTransferFrom(
        address sender,
        address recipient,
        uint256 amount,
        bytes memory data
    ) external override {
        _safeTransferFrom(sender, recipient, amount, data);
    }

    function safeTransferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external override {
        _safeTransferFrom(sender, recipient, amount, "");
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(
            to != address(this),
            "cannot transfer tokens to the token contract"
        );
        super._beforeTokenTransfer(from, to, amount);
    }

    function _safeTransfer(
        address recipient,
        uint256 amount,
        bytes memory data
    ) internal {
        transfer(recipient, amount);
        require(
            _checkOnKIP7Received(msg.sender, recipient, amount, data),
            "KIP7: transfer to non KIP7Receiver implementer"
        );
    }

    function _safeTransferFrom(
        address sender,
        address recipient,
        uint256 amount,
        bytes memory data
    ) internal {
        transferFrom(sender, recipient, amount);
        require(
            _checkOnKIP7Received(sender, recipient, amount, data),
            "KIP7: transfer to non KIP7Receiver implementer"
        );
    }

    function _checkOnKIP7Received(
        address sender,
        address recipient,
        uint256 amount,
        bytes memory _data
    ) internal returns (bool) {
        if (!recipient.isContract()) {
            return true;
        }

        bytes4 retval = IKIP7Receiver(recipient).onKIP7Received(
            msg.sender,
            sender,
            amount,
            _data
        );
        return (retval == _KIP7_RECEIVED);
    }
}
