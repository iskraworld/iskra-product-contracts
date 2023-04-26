// SPDX-FileCopyrightText: 2023 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/interfaces/IERC1363.sol";
import "@openzeppelin/contracts/interfaces/IERC1363Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

// GameToken features
//  - ERC20 basic functions
//  - fixed supply
//  - not mintable, not burnable
//  - IERC1363Receiver feature
//  - defense for transferring tokens to the token contract itself
contract GameToken is IERC20Metadata, ERC20, IERC1363, Ownable2Step {
    using Address for address;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply
    ) ERC20(name_, symbol_) {
        _mint(_msgSender(), initialSupply);
    }

    function supportsInterface(bytes4 interfaceId)
        external
        pure
        override
        returns (bool)
    {
        return
            interfaceId == type(IERC20Metadata).interfaceId ||
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC1363).interfaceId ||
            interfaceId == type(IERC20).interfaceId;
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
            "GameToken: _checkAndCallTransfer reverts"
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
            "GameToken: _checkAndCallTransfer reverts"
        );
        return true;
    }

    function approveAndCall(address, uint256)
        external
        pure
        override
        returns (bool)
    {
        revert(
            "GameToken: does not support approveAndCall due to security issue of approve"
        );
    }

    function approveAndCall(
        address,
        uint256,
        bytes memory
    ) external pure override returns (bool) {
        revert(
            "GameToken: does not support approveAndCall due to security issue of approve"
        );
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(
            to != address(this),
            "GameToken: cannot transfer tokens to the token contract"
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
            revert("GameToken: transfer to non contract address");
        }

        try
            IERC1363Receiver(recipient).onTransferReceived(
                _msgSender(),
                sender,
                amount,
                data
            )
        returns (bytes4 retval) {
            return retval == IERC1363Receiver.onTransferReceived.selector;
        } catch (bytes memory reason) {
            if (reason.length == 0) {
                revert(
                    "GameToken: transfer to non ERC1363Receiver implementer"
                );
            } else {
                /// @solidity memory-safe-assembly
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    }
}
