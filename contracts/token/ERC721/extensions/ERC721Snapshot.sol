// SPDX-FileCopyrightText: 2023 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

// Copied from [Openzeppelin ERC20Snapshot](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/b709eae01d1da91902d06ace340df6b324e6f049/contracts/token/ERC20/extensions/ERC20Snapshot.sol)
// Modified for ERC721.
// This can snapshot account balances and token owners.

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Arrays.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

abstract contract ERC721Snapshot is ERC721 {
    using Arrays for uint256[];
    using Counters for Counters.Counter;

    struct UintSnapshots {
        uint256[] ids;
        uint256[] values;
    }

    struct AddressSnapshots {
        uint256[] ids;
        address[] values;
    }

    mapping(address => UintSnapshots) private _balanceSnapshots;

    mapping(uint256 => AddressSnapshots) private _ownerSnapshots;

    Counters.Counter private _currentSnapshotId;

    event Snapshot(uint256 indexed id);

    function _snapshot() internal virtual returns (uint256) {
        _currentSnapshotId.increment();

        uint256 currentId = _getCurrentSnapshotId();
        emit Snapshot(currentId);
        return currentId;
    }

    function _getCurrentSnapshotId() internal view virtual returns (uint256) {
        return _currentSnapshotId.current();
    }

    /**
     * @dev Retrieves the balance of `account` at the time `snapshotId` was created.
     */
    function balanceOfAt(address account, uint256 snapshotId)
        public
        view
        virtual
        returns (uint256)
    {
        (bool snapshotted, uint256 balance) = _valueAt(
            snapshotId,
            _balanceSnapshots[account]
        );

        return snapshotted ? balance : balanceOf(account);
    }

    /**
     * @dev Retrieves the owner of `tokenId` at the time `snapshotId` was created.
     */
    function ownerOfAt(uint256 tokenId, uint256 snapshotId)
        public
        view
        virtual
        returns (address)
    {
        (bool snapshotted, address owner) = _valueAt(
            snapshotId,
            _ownerSnapshots[tokenId]
        );

        if (snapshotted) {
            require(owner != address(0), "ERC721Snapshot: invalid token ID");
            return owner;
        }
        return ownerOf(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        if (from != address(0)) {
            _updateBalanceSnapshot(from);
        }
        if (to != address(0)) {
            _updateBalanceSnapshot(to);
        }

        _updateOwnerSnapshot(tokenId);
    }

    function _valueAt(uint256 snapshotId, UintSnapshots storage snapshots)
        private
        view
        returns (bool, uint256)
    {
        uint256 index = _findSnapshotIndex(snapshotId, snapshots.ids);

        if (index == snapshots.ids.length) {
            return (false, 0);
        } else {
            return (true, snapshots.values[index]);
        }
    }

    function _valueAt(uint256 snapshotId, AddressSnapshots storage snapshots)
        private
        view
        returns (bool, address)
    {
        uint256 index = _findSnapshotIndex(snapshotId, snapshots.ids);

        if (index == snapshots.ids.length) {
            return (false, address(0));
        } else {
            return (true, snapshots.values[index]);
        }
    }

    function _findSnapshotIndex(
        uint256 snapshotId,
        uint256[] storage snapshotsIds
    ) private view returns (uint256) {
        require(snapshotId > 0, "ERC721Snapshot: snapshot id is 0");
        require(
            snapshotId <= _getCurrentSnapshotId(),
            "ERC721Snapshot: nonexistent snapshot id"
        );

        return snapshotsIds.findUpperBound(snapshotId);
    }

    function _updateBalanceSnapshot(address account) private {
        _updateSnapshots(_balanceSnapshots[account], balanceOf(account));
    }

    function _updateOwnerSnapshot(uint256 tokenId) private {
        _updateSnapshots(_ownerSnapshots[tokenId], _ownerOf(tokenId));
    }

    function _updateSnapshots(
        UintSnapshots storage snapshots,
        uint256 currentValue
    ) private {
        uint256 currentId = _getCurrentSnapshotId();
        if (_lastSnapshotId(snapshots.ids) < currentId) {
            snapshots.ids.push(currentId);
            snapshots.values.push(currentValue);
        }
    }

    function _updateSnapshots(
        AddressSnapshots storage snapshots,
        address currentValue
    ) private {
        uint256 currentId = _getCurrentSnapshotId();
        if (_lastSnapshotId(snapshots.ids) < currentId) {
            snapshots.ids.push(currentId);
            snapshots.values.push(currentValue);
        }
    }

    function _lastSnapshotId(uint256[] storage ids)
        private
        view
        returns (uint256)
    {
        if (ids.length == 0) {
            return 0;
        } else {
            return ids[ids.length - 1];
        }
    }
}
