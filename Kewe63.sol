// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ISignatureTransfer {
    struct TokenPermissions {
        address token;
        uint256 amount;
    }
    struct PermitTransferFrom {
        TokenPermissions permitted;
        uint256 nonce;
        uint256 deadline;
    }
    struct SignatureTransferDetails {
        address to;
        uint256 requestedAmount;
    }
    function permitTransferFrom(
        PermitTransferFrom memory permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;
}

contract Kewe63 is Ownable {
    using SafeERC20 for IERC20;

    ISignatureTransfer public immutable permit2;
    address public relayer;

    uint256 public feeRate = 0;
    uint256 public accumulatedFees;

    uint256 public minSwapAmount = 0;
    uint256 public maxSwapAmount = 0;

    bool public paused = false;

    uint256 public totalSwaps;
    uint256 public totalVolumeIn;

    mapping(address => mapping(address => uint256)) public lpBalances;
    mapping(address => uint256) public rewardPoints;

    event SwapSettled(address indexed user, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut, uint256 fee);
    event LiquidityAdded(address indexed user, address indexed token, uint256 amount);
    event LiquidityWithdrawn(address indexed user, address indexed token, uint256 amount);
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);
    event SwapLimitsUpdated(uint256 minAmount, uint256 maxAmount);
    event Paused(address by);
    event Unpaused(address by);
    event FeesWithdrawn(address indexed token, uint256 amount);

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer");
        _;
    }

    constructor(address _permit2, address _relayer) Ownable(msg.sender) {
        permit2 = ISignatureTransfer(_permit2);
        relayer = _relayer;
    }

    function setRelayer(address _relayer) external onlyOwner {
        relayer = _relayer;
    }

    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 1000, "Fee too high");
        emit FeeRateUpdated(feeRate, _feeRate);
        feeRate = _feeRate;
    }

    function setSwapLimits(uint256 _min, uint256 _max) external onlyOwner {
        require(_max == 0 || _max >= _min, "Invalid limits");
        minSwapAmount = _min;
        maxSwapAmount = _max;
        emit SwapLimitsUpdated(_min, _max);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        if (_paused) emit Paused(msg.sender);
        else emit Unpaused(msg.sender);
    }

    function withdrawFees(address token, uint256 amount) external onlyOwner {
        require(amount <= accumulatedFees, "Exceeds accumulated fees");
        accumulatedFees -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit FeesWithdrawn(token, amount);
    }

    function withdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    function depositLiquidity(address token, uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        lpBalances[msg.sender][token] += amount;
        rewardPoints[msg.sender] += amount / 1e6;
        emit LiquidityAdded(msg.sender, token, amount);
    }

    function withdrawLiquidity(address token, uint256 amount) external whenNotPaused {
        require(lpBalances[msg.sender][token] >= amount, "Insufficient LP balance");
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient pool depth");
        lpBalances[msg.sender][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        emit LiquidityWithdrawn(msg.sender, token, amount);
    }

    function settle(
        address user,
        address tokenIn,
        uint256 amountIn,
        address tokenOut,
        uint256 amountOut,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external onlyRelayer whenNotPaused {
        if (minSwapAmount > 0) require(amountIn >= minSwapAmount, "Below minimum swap");
        if (maxSwapAmount > 0) require(amountIn <= maxSwapAmount, "Exceeds maximum swap");

        uint256 fee = feeRate > 0 ? (amountOut * feeRate / 10000) : 0;
        uint256 amountOutAfterFee = amountOut - fee;

        require(IERC20(tokenOut).balanceOf(address(this)) >= amountOut, "Insufficient liquidity");

        ISignatureTransfer.PermitTransferFrom memory permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({ token: tokenIn, amount: amountIn }),
            nonce: nonce,
            deadline: deadline
        });

        ISignatureTransfer.SignatureTransferDetails memory transferDetails = ISignatureTransfer.SignatureTransferDetails({
            to: address(this),
            requestedAmount: amountIn
        });

        permit2.permitTransferFrom(permit, transferDetails, user, signature);

        IERC20(tokenOut).safeTransfer(user, amountOutAfterFee);

        accumulatedFees += fee;
        totalSwaps++;
        totalVolumeIn += amountIn;

        emit SwapSettled(user, tokenIn, amountIn, tokenOut, amountOutAfterFee, fee);
    }

    function getLPBalance(address user, address token) external view returns (uint256) {
        return lpBalances[user][token];
    }

    function getRewardPoints(address user) external view returns (uint256) {
        return rewardPoints[user];
    }

    function getStats() external view returns (uint256 swaps, uint256 volume, uint256 fees) {
        return (totalSwaps, totalVolumeIn, accumulatedFees);
    }
}
