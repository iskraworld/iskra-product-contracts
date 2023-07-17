// SPDX-FileCopyrightText: 2023 ISKRA Pte. Ltd.
// SPDX-License-Identifier: MIT
// @author iskra.world dev team

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../token/ERC20/UtilityToken.sol";
import "../vesting/Vesting.sol";

contract UtilityTokenMinter is Ownable2Step, IERC1363Receiver {
    using SafeERC20 for IERC20;

    uint24 private constant _MILLION = 1_000_000;
    uint24 private constant _SUPPORTED_DECIMALS = 18;

    // mint info
    UtilityToken public immutable token;
    address public immutable paymentToken;
    address public immutable treasury;

    // share info
    address public shareRecipient;
    uint24 public sharePerMillion;

    // share vesting info
    address public vestingBeacon;
    uint16 public unlockPeriodHours;
    uint16 public vestingDuration;
    Vesting[] private _vestings;

    event UpdateShareInfo(address shareRecipient, uint24 sharePerMillion);
    event UpdateShareVestingInfo(
        address vestingBeacon,
        uint16 unlockPeriodHours,
        uint16 vestingDuration
    );
    event Mint(
        address indexed to,
        uint256 amount,
        address shareRecipient,
        uint256 shareAmount,
        address vestingAddress
    );
    event ClaimVesting(address indexed shareRecipient, uint256 claimedTotal);

    constructor(
        address token_,
        address paymentToken_,
        address treasury_,
        address shareRecipient_,
        uint24 sharePerMillion_,
        address vestingBeacon_,
        uint16 unlockPeriodHours_,
        uint16 vestingDuration_
    ) {
        require(token_ != address(0), "invalid token");
        require(paymentToken_ != address(0), "invalid paymentToken");
        require(treasury_ != address(0), "invalid treasury");
        require(treasury_ != address(this), "treasury cannot be own address");

        // the vesting contract supports only decimal 18 tokens
        require(
            IERC20Metadata(token_).decimals() == _SUPPORTED_DECIMALS,
            "unsupported decimals(token)"
        );
        require(
            IERC20Metadata(paymentToken_).decimals() == _SUPPORTED_DECIMALS,
            "unsupported decimals(paymentToken)"
        );

        token = UtilityToken(token_);
        paymentToken = paymentToken_;
        treasury = treasury_;

        updateShareInfo(shareRecipient_, sharePerMillion_);
        updateShareVestingInfo(
            vestingBeacon_,
            unlockPeriodHours_,
            vestingDuration_
        );
    }

    function onTransferReceived(
        address,
        address from,
        uint256 amount,
        bytes memory data
    ) external override returns (bytes4) {
        require(_msgSender() == paymentToken, "invalid caller");

        require(
            data.length > 0,
            "invalid transfer data; transfer data is empty"
        );

        bool useVestingForShare = abi.decode(data, (bool));
        _mint(from, amount, useVestingForShare);
        IERC20(paymentToken).safeTransfer(treasury, amount);
        return IERC1363Receiver.onTransferReceived.selector;
    }

    function mint(
        address from,
        uint256 amount,
        bool useVestingForShare
    ) external {
        IERC20(paymentToken).safeTransferFrom(from, treasury, amount);

        _mint(from, amount, useVestingForShare);
    }

    function _mint(
        address to,
        uint256 amount,
        bool useVestingForShare
    ) internal {
        require(to != address(0), "invalid recipient");
        require(amount > 0, "invalid amount");

        token.mint(address(this), amount);

        uint256 shareAmount = (amount * sharePerMillion) / _MILLION;
        token.transfer(to, amount - shareAmount);

        address vestingAddress;
        if (shareAmount > 0) {
            if (useVestingForShare) {
                require(
                    shareAmount % 10**_SUPPORTED_DECIMALS == 0,
                    "Vesting for sub-decimal amounts are not supported"
                );

                vestingAddress = _createVesting();
                Vesting vesting = _vestings.push() = Vesting(vestingAddress);
                token.approve(address(vesting), shareAmount);
                vesting.prepare(
                    address(this),
                    address(this),
                    shareAmount / 10**_SUPPORTED_DECIMALS,
                    0,
                    unlockPeriodHours,
                    vestingDuration,
                    address(token)
                );
                vesting.setStart(block.timestamp);
                vesting.transferOwnership(owner());
            } else {
                token.transfer(shareRecipient, shareAmount);
            }
        }

        emit Mint(to, amount, shareRecipient, shareAmount, vestingAddress);
    }

    function _createVesting() internal returns (address) {
        bytes memory initArgs = abi.encodeWithSelector(
            Vesting.initialize.selector
        );
        return address(new BeaconProxy(vestingBeacon, initArgs));
    }

    function claimVesting(uint256 offset, uint256 count)
        external
        returns (uint256)
    {
        require(_msgSender() == shareRecipient, "invalid operator");

        uint256 normalizedClaimedTotal = 0;
        uint256 offsetTo = _min(offset + count, _vestings.length);
        for (uint256 i = offset; i < offsetTo; i++) {
            if (_vestings[i].status() == Vesting.VestingStatus.ACTIVE) {
                uint256 amount = _vestings[i].getClaimableAmount();
                if (amount > 0) {
                    _vestings[i].claim(amount);
                    normalizedClaimedTotal += amount;
                }
            }
        }

        uint256 claimedTotal = normalizedClaimedTotal * 10**_SUPPORTED_DECIMALS;
        if (claimedTotal > 0) {
            token.transfer(shareRecipient, claimedTotal);
        }

        emit ClaimVesting(shareRecipient, claimedTotal);
        return claimedTotal;
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function updateShareInfo(address shareRecipient_, uint24 sharePerMillion_)
        public
        onlyOwner
    {
        require(shareRecipient_ != address(0), "invalid shareRecipient");
        require(sharePerMillion_ < _MILLION, "invalid sharePerMillion");

        shareRecipient = shareRecipient_;
        sharePerMillion = sharePerMillion_;

        emit UpdateShareInfo(shareRecipient_, sharePerMillion_);
    }

    function updateShareVestingInfo(
        address vestingBeacon_,
        uint16 unlockPeriodHours_,
        uint16 vestingDuration_
    ) public onlyOwner {
        require(vestingBeacon_ != address(0), "invalid vestingBeacon");
        require(unlockPeriodHours_ > 0, "invalid unlockPeriodHours");
        require(vestingDuration_ > 0, "invalid vestingDuration");

        vestingBeacon = vestingBeacon_;
        unlockPeriodHours = unlockPeriodHours_;
        vestingDuration = vestingDuration_;

        emit UpdateShareVestingInfo(
            vestingBeacon_,
            unlockPeriodHours_,
            vestingDuration_
        );
    }

    // getters

    function vestingCount() external view returns (uint256) {
        return _vestings.length;
    }

    function vestingAt(uint256 index) external view returns (Vesting) {
        return _vestings[index];
    }

    function vestings(uint256 offset, uint256 count)
        external
        view
        returns (address[] memory addresses, uint256 claimableSubtotal)
    {
        uint256 offsetTo = _min(offset + count, _vestings.length);
        addresses = new address[](offsetTo - offset);
        uint256 normalizedClaimableTotal = 0;
        for (uint256 i = offset; i < offsetTo; i++) {
            if (_vestings[i].status() == Vesting.VestingStatus.ACTIVE) {
                normalizedClaimableTotal += _vestings[i].getClaimableAmount();
            }
            addresses[i - offset] = address(_vestings[i]);
        }
        return (addresses, normalizedClaimableTotal * 10**_SUPPORTED_DECIMALS);
    }
}
