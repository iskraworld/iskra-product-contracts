// SPDX-FileCopyrightText: 2022 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Vesting is OwnableUpgradeable {
    event Prepared(
        address distributor,
        address beneficiary,
        uint256 amount,
        uint256 initialUnlocked,
        uint256 unlockPeriodHours,
        uint256 duration,
        address token
    );
    event SetStart(uint256 start);
    event Claimed(uint256 amount);
    event Revoked(address reclaimer);
    event SetBeneficiary(address newBeneficiary);

    enum VestingStatus {
        CREATED,
        PREPARED,
        ACTIVE,
        REVOKED
    }

    uint256 constant HOURS = 1 hours;

    IERC20 public token;
    address public beneficiary;
    uint256 public start;
    uint256 public end;
    uint256 public unlockPeriod;
    uint256 public duration;
    uint256 public claimedAmount;
    uint256 public initialVestingAmount;
    uint256 public initialUnlockedAmount;
    uint256 public remainder;
    uint256 public unlockUnit;
    VestingStatus public status;

    function initialize() public initializer {
        __Ownable_init();
    }

    /**
     * @notice Prepare a contract for vesting.
     * @notice Tokens sent directly to this contract without using this function are not included in the vesting amount.
     * @param _beneficiary contract partner. The only one who can claim unlocked amount from this vesting.
     * @param _amount vesting amount.
     * @param _duration the number of unlocking. Whole vesting duration becomes _duration * unlockPeriod
     */
    function prepare(
        address _distributor,
        address _beneficiary,
        uint256 _amount,
        uint256 _initialUnlocked,
        uint256 _unlockPeriodHours,
        uint256 _duration,
        address _token
    ) public virtual checkStatus(status == VestingStatus.CREATED) onlyOwner {
        require(
            _beneficiary != address(0),
            "Vesting: `_beneficiary` is zero address(0)"
        );
        require(_duration > 0, "Vesting:  `_duration` is 0");
        // otherwise, claimer can claim all amount after first unlock period
        require(_amount > 0, "Vesting: `_amount` is 0");
        require(
            _amount >= _initialUnlocked,
            "Vesting: `_initialUnlocked` is greater than `_amount`"
        );
        require(_unlockPeriodHours > 0, "Vesting: _unlockPeriodHours is zero");
        require(
            _amount >= _duration,
            "Vesting: _amount must be greater than _duration"
        );

        token = IERC20(_token);
        unlockPeriod = _unlockPeriodHours * HOURS;
        duration = _duration;
        beneficiary = _beneficiary;
        initialVestingAmount = _amount;
        initialUnlockedAmount = _initialUnlocked;
        uint256 _totalLocked = initialVestingAmount - initialUnlockedAmount;
        unlockUnit = _totalLocked / duration;
        remainder = _totalLocked - (unlockUnit * duration);
        token.transferFrom(
            _distributor,
            address(this),
            initialVestingAmount * 10**18
        );
        status = VestingStatus.PREPARED;

        emit Prepared(
            _distributor,
            beneficiary,
            initialVestingAmount,
            initialUnlockedAmount,
            _unlockPeriodHours,
            duration,
            _token
        );
    }

    function getUnlockPeriodHours() public view returns (uint256) {
        return unlockPeriod / HOURS;
    }

    /**
     * @notice Set start time. This can be called only once.
     * @param _start the start time. It may be in the past or in the future than in the present.
     */
    function setStart(uint256 _start)
        public
        virtual
        checkStatus(status == VestingStatus.PREPARED)
        onlyOwner
    {
        require(_start > 0, "Vesting: `_start` is 0");

        start = _start;
        end = start + duration * unlockPeriod;
        status = VestingStatus.ACTIVE;

        emit SetStart(start);
    }

    /**
     * @notice Revoke the vesting. All remain tokens are transferred to reclaimer.
     * @notice Revoke can be called many times. It can be used to retrieve incorrectly transmitted tokens.
     */
    function revoke(address _reclaimer)
        public
        virtual
        checkStatus(status != VestingStatus.CREATED)
        onlyOwner
    {
        uint256 _amount = token.balanceOf(address(this));
        if (_amount > 0) {
            token.transfer(_reclaimer, _amount);
        }
        status = VestingStatus.REVOKED;

        emit Revoked(_reclaimer);
    }

    /**
     * @notice Claims unlocked amount. Only beneficiary can call this.
     * @notice Revoked vesting cannot be claimed.
     * @param _amount the amount to claim. It should be less than total unlocked amount.
     */
    function claim(uint256 _amount)
        public
        virtual
        checkStatus(status == VestingStatus.ACTIVE)
        onlyBeneficiary
    {
        require(_amount > 0, "Vesting: `_amount` is 0");

        uint256 _claimable = getClaimableAmount();
        require(_amount <= _claimable, "Vesting: insufficient funds");

        token.transfer(beneficiary, _amount * 10**18);
        claimedAmount = claimedAmount + _amount;

        emit Claimed(_amount);
    }

    /**
     * @notice Changes the beneficiary. Only beneficiary can change it.
     * @param _newBeneficiary the new beneficiary.
     */
    function changeBeneficiary(address _newBeneficiary)
        public
        virtual
        checkStatus(
            status == VestingStatus.PREPARED || status == VestingStatus.ACTIVE
        )
        onlyBeneficiary
    {
        beneficiary = _newBeneficiary;
        emit SetBeneficiary(beneficiary);
    }

    /**
     * @notice Gets the timestamp of next unlocking.
     * @notice If the start is not defined, then it throws an error.
     */
    function getNextUnlock()
        public
        view
        virtual
        checkStatus(status == VestingStatus.ACTIVE)
        returns (uint256)
    {
        require(
            block.timestamp < end,
            "Vesting: there's no remaining unlock time"
        );

        if (block.timestamp <= start) {
            return start + unlockPeriod;
        }
        if (block.timestamp >= end) {}
        return
            start +
            ((block.timestamp - start) / unlockPeriod + 1) *
            unlockPeriod;
    }

    /**
     * @notice Gets the currently claimable amount(total unlocked - claimed).
     * @notice If the start is not defined or vesting is not started yet, then it gets 0.
     */
    function getClaimableAmount()
        public
        view
        virtual
        checkStatus(status == VestingStatus.ACTIVE)
        returns (uint256)
    {
        return _unlockedAmount() - claimedAmount;
    }

    /**
     * @notice Gets the currently unlocked amount.
     * @notice If the start is not defined yet, then it gets 0.
     */
    function getUnlockedAmount()
        public
        view
        virtual
        checkStatus(status == VestingStatus.ACTIVE)
        returns (uint256)
    {
        return _unlockedAmount();
    }

    /**
     * @notice Gets the currently locked amount.
     * @notice If the start is not defined yet, then it gets 0.
     */
    function getLockedAmount()
        public
        view
        virtual
        checkStatus(status == VestingStatus.ACTIVE)
        returns (uint256)
    {
        return initialVestingAmount - _unlockedAmount();
    }

    modifier checkStatus(bool stateExpr) {
        require(
            stateExpr,
            "Vesting: not in a status in which the operation can be executed"
        );
        _;
    }

    modifier onlyBeneficiary() {
        require(
            msg.sender == beneficiary,
            "Vesting: the caller is not the beneficiary"
        );
        _;
    }

    /**
     * @notice Gets the token amount that has been unlocked util now.
     * @notice If the start is not defined or vesting is not started yet, then it gets 0.
     */
    function _unlockedAmount() internal view virtual returns (uint256) {
        uint256 unlocks = _unlockedTimes();
        uint256 result = initialUnlockedAmount + unlockUnit * unlocks;
        if (unlocks > 0) {
            // The remainder is unlocked at first time
            result += remainder;
        }
        return result;
    }

    /**
     * @notice Gets the number of times it is unlocked.
     * @notice If the start is not defined or vesting is not started yet, then it gets 0.
     * @notice If the vesting duration is expired, it returns the maximum times.
     * @notice It includes the current unlocking times if block.timestamp is the exact timing of unlocking.
     */
    function _unlockedTimes() internal view virtual returns (uint256) {
        if (start == 0) {
            return 0;
        }
        if (block.timestamp < start) {
            return 0;
        }
        if (block.timestamp >= end) {
            return duration;
        }
        return (block.timestamp - start) / unlockPeriod;
    }
}
