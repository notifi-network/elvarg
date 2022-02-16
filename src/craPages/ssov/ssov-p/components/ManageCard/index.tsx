import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Addresses,
  ERC20,
  ERC20__factory,
  ERC20SSOV1inchRouter__factory,
  NativeSSOV1inchRouter__factory,
  Aggregation1inchRouterV4__factory,
} from '@dopex-io/sdk';

import Countdown from 'react-countdown';
import cx from 'classnames';
import format from 'date-fns/format';
import { isNaN } from 'formik';
import axios from 'axios';
import { Tabs, PanelList, Panel } from 'react-swipeable-tab';
import { BigNumber, ethers } from 'ethers';

import Box from '@material-ui/core/Box';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';

import { WalletContext } from 'contexts/Wallet';
import { SsovContext, SsovProperties } from 'contexts/SsovPuts';
import { AssetsContext, IS_NATIVE } from 'contexts/Assets';
import styles from './styles.module.scss';
import Withdraw from './Withdraw';

import CustomButton from 'components/UI/CustomButton';
import Typography from 'components/UI/Typography';
import EstimatedGasCostButton from 'components/EstimatedGasCostButton';
import ZapInButton from 'components/ZapInButton';
import ZapIn from 'components/ZapIn';
import ZapOutButton from 'components/ZapOutButton';
import getDecimalsFromSymbol from 'utils/general/getDecimalsFromSymbol';

import useSendTx from 'hooks/useSendTx';
import getUserReadableAmount from 'utils/contracts/getUserReadableAmount';
import getContractReadableAmount from 'utils/contracts/getContractReadableAmount';
import formatAmount from 'utils/general/formatAmount';
import { getValueInUsdFromSymbol } from 'utils/general/getValueInUsdFromSymbol';
import { MAX_VALUE, SSOV_PUTS_MAP } from 'constants/index';

import ZapIcon from 'components/Icons/ZapIcon';
import TransparentCrossIcon from 'components/Icons/TransparentCrossIcon';
import ArrowRightIcon from 'components/Icons/ArrowRightIcon';
import LockerIcon from 'components/Icons/LockerIcon';
import WhiteLockerIcon from 'components/Icons/WhiteLockerIcon';

const SelectMenuProps = {
  PaperProps: {
    style: {
      maxHeight: 324,
      width: 250,
    },
  },
  classes: {
    paper: 'bg-mineshaft',
  },
};

const usdcAddress = '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8';
const usdtAddress = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';
const crv2Address = '0x7f90122bf0700f9e7e1f688fe926940e8839f353';

const ManageCard = ({ ssovProperties }: { ssovProperties: SsovProperties }) => {
  const {
    updateSsovData,
    updateUserSsovData,
    selectedSsov,
    ssovDataArray,
    userSsovDataArray,
    ssovSignerArray,
  } = useContext(SsovContext);
  const sendTx = useSendTx();
  const { accountAddress, chainId, provider, signer } =
    useContext(WalletContext);
  const aggregation1inchRouter = Addresses[chainId]['1inchRouter']
    ? Aggregation1inchRouterV4__factory.connect(
        Addresses[chainId]['1inchRouter'],
        signer
      )
    : null;
  const erc20SSOV1inchRouter = Addresses[chainId]['ERC20SSOV1inchRouter']
    ? ERC20SSOV1inchRouter__factory.connect(
        Addresses[chainId]['ERC20SSOV1inchRouter'],
        signer
      )
    : null;
  const nativeSSOV1inchRouter = Addresses[chainId]['NativeSSOV1inchRouter']
    ? NativeSSOV1inchRouter__factory.connect(
        Addresses[chainId]['NativeSSOV1inchRouter'],
        signer
      )
    : null;
  const { updateAssetBalances, userAssetBalances, tokens, tokenPrices } =
    useContext(AssetsContext);
  const ssovTokenSymbol = SSOV_PUTS_MAP[ssovProperties.tokenName].tokenSymbol;
  const ssovDepositPurchaseTokens =
    SSOV_PUTS_MAP[ssovProperties.tokenName].tokens;
  const [isZapInAvailable, setIsZapInAvailable] = useState<boolean>(true);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.3);
  const { ssovContractWithSigner, ssovRouter } = ssovSignerArray[selectedSsov];
  const [isFetchingPath, setIsFetchingPath] = useState<boolean>(false);
  const { userEpochDeposits } = userSsovDataArray[selectedSsov];
  const { epochTimes, isVaultReady, epochStrikes, totalEpochDeposits } =
    ssovDataArray[selectedSsov];

  const [selectedStrikeIndexes, setSelectedStrikeIndexes] = useState<number[]>(
    []
  );
  const [strikeDepositAmounts, setStrikeDepositAmounts] = useState<{
    [key: number]: number | string;
  }>({});
  const [userTokenBalance, setUserTokenBalance] = useState<BigNumber>(
    BigNumber.from('0')
  );
  const [approved, setApproved] = useState<boolean>(false);
  const [quote, setQuote] = useState<object>({});
  const [path, setPath] = useState<object>({});
  const [activeTab, setActiveTab] = useState<string>('deposit');
  const [isZapInVisible, setIsZapInVisible] = useState<boolean>(false);
  const [token, setToken] = useState<ERC20 | any>(
    ssovSignerArray[selectedSsov].token[0]
  );

  const [tokenName, setTokenName] = useState<string>(ssovTokenSymbol);
  const ssovToken = ssovSignerArray[selectedSsov].token[0];

  const selectedTokenPrice: number = useMemo(() => {
    let price = 0;
    tokenPrices.map((record) => {
      if (record['name'].toUpperCase() === tokenName.toUpperCase())
        price = record['price'];
    });
    return price;
  }, [tokenPrices, tokenName]);

  const extraHeight: number = useMemo(() => {
    if (isZapInVisible) return 10;
    if (activeTab === 'deposit') return selectedStrikeIndexes.length * 2.6;
    else if (activeTab === 'withdraw') return 0;
  }, [activeTab, selectedStrikeIndexes, isZapInVisible]);

  const isDepositWindowOpen = useMemo(() => {
    if (epochStrikes.length === 0) return false;
    return true;
  }, [epochStrikes]);

  const activeIndex: number = useMemo(() => {
    if (isZapInVisible) return 2;
    else {
      if (activeTab === 'deposit') return 0;
      else return 1;
    }
  }, [activeTab, isZapInVisible]);

  const ssovTokenName = ssovProperties.tokenName;

  const getQuote = useCallback(async () => {
    const fromTokenAddress = IS_NATIVE(token)
      ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
      : token.address;
    const toTokenAddress = ssovToken.address;
    if (fromTokenAddress === toTokenAddress) return;
    const amount = (10 ** getDecimalsFromSymbol(tokenName, chainId)).toString();
    const { data } = await axios.get(
      `https://api.1inch.exchange/v4.0/${chainId}/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${accountAddress}&slippage=0&disableEstimate=true`
    );
    setQuote(data);
  }, [accountAddress, chainId, ssovToken.address, token, tokenName]);

  const contractReadableStrikeDepositAmounts = useMemo(() => {
    const readable: {
      [key: number]: BigNumber;
    } = {};
    Object.keys(strikeDepositAmounts).map((key) => {
      readable[key] = getContractReadableAmount(strikeDepositAmounts[key], 18);
    });
    return readable;
  }, [strikeDepositAmounts]);

  const isZapActive: boolean = useMemo(() => {
    return (
      tokenName.toUpperCase() === ssovDepositPurchaseTokens[0].toUpperCase()
    );
  }, [tokenName, ssovDepositPurchaseTokens]);

  const [denominationTokenName, setDenomationTokenName] =
    useState<string>('2CRV');

  const spender: string = isZapActive
    ? ssovRouter.address
    : ssovContractWithSigner.address;

  const purchasePower =
    isZapActive && quote['toToken'] && denominationTokenName === ssovTokenName
      ? getUserReadableAmount(
          quote['toTokenAmount'],
          quote['toToken']['decimals']
        ) /
        (1 + slippageTolerance / 100)
      : getUserReadableAmount(
          userTokenBalance,
          getDecimalsFromSymbol(tokenName, chainId)
        );

  const strikes = epochStrikes.map((strike) =>
    getUserReadableAmount(strike, 8).toString()
  );

  const totalDepositAmount = useMemo(() => {
    let total = 0;
    Object.keys(strikeDepositAmounts).map((strike) => {
      total += parseFloat(strikeDepositAmounts[strike]);
    });
    return total;
  }, [strikeDepositAmounts]);

  const isPurchasePowerEnough = useMemo(() => {
    return purchasePower >= totalDepositAmount;
  }, [purchasePower, totalDepositAmount]);

  const openZapIn = () => {
    if (isZapActive) {
      setIsZapInVisible(true);
    } else {
      const filteredTokens = ['ETH']
        .concat(tokens)
        .filter(function (item) {
          return (
            item !== ssovTokenSymbol &&
            (Addresses[chainId][item] || IS_NATIVE(item))
          );
        })
        .sort((a, b) => {
          return (
            getValueInUsdFromSymbol(
              b,
              tokenPrices,
              userAssetBalances,
              getDecimalsFromSymbol(b, chainId)
            ) -
            getValueInUsdFromSymbol(
              a,
              tokenPrices,
              getValueInUsdFromSymbol,
              getDecimalsFromSymbol(b, chainId)
            )
          );
        });

      const selectedToken = IS_NATIVE(filteredTokens[0])
        ? filteredTokens[0]
        : ERC20__factory.connect(
            Addresses[chainId][filteredTokens[0]],
            provider
          );
      setToken(selectedToken);
      setIsZapInVisible(true);
    }
  };

  const handleTokenChange = useCallback(async () => {
    const symbol = IS_NATIVE(token) ? token : await token.symbol();
    setTokenName(symbol);
    await getQuote();
  }, [getQuote, token]);

  const totalEpochDepositsAmount = getUserReadableAmount(
    totalEpochDeposits,
    18
  ).toString();

  const userEpochDepositsAmount = getUserReadableAmount(
    userEpochDeposits,
    18
  ).toString();

  // Handles strikes & deposit amounts
  const handleSelectStrikes = useCallback(
    (event: React.ChangeEvent<{ value: unknown }>) => {
      setSelectedStrikeIndexes((event.target.value as number[]).sort());
    },
    []
  );

  const vaultShare = useMemo(() => {
    return (
      (100 * parseFloat(userEpochDepositsAmount)) /
      parseFloat(totalEpochDepositsAmount)
    );
  }, [userEpochDepositsAmount, totalEpochDepositsAmount]);

  const unselectStrike = (index) => {
    setSelectedStrikeIndexes(
      selectedStrikeIndexes.filter(function (item) {
        return item !== index;
      })
    );
  };

  const inputStrikeDepositAmount = useCallback(
    (
      index: number,
      e?: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      value?: number
    ) => {
      let input = e
        ? [',', '.'].includes(e.target.value[e.target.value.length - 1])
          ? e.target.value
          : parseFloat(e.target.value.replace(',', '.'))
        : value;
      if (e && parseFloat(e.target.value) === 0) input = e.target.value;
      if (isNaN(input)) input = 0;
      setStrikeDepositAmounts((prevState) => ({
        ...prevState,
        [index]: input,
      }));
    },
    []
  );

  const handleApprove = useCallback(async () => {
    if (!ssovContractWithSigner || !ssovRouter) return;
    let currentToken = crv2Address;
    if (denominationTokenName === 'USDT') {
      currentToken = usdtAddress;
    } else if (denominationTokenName === 'USDC') {
      currentToken = usdcAddress;
    } else if (denominationTokenName === '2CRV') {
      currentToken = crv2Address;
    }
    try {
      await sendTx(
        ERC20__factory.connect(currentToken, signer).approve(
          denominationTokenName === '2CRV'
            ? ssovContractWithSigner.address
            : ssovRouter.address,
          MAX_VALUE
        )
      );
      setApproved(true);
    } catch (err) {
      console.log(err);
    }
  }, [
    sendTx,
    signer,
    denominationTokenName,
    ssovRouter,
    ssovContractWithSigner,
  ]);
  const strikeIndexes = selectedStrikeIndexes.filter(
    (index) =>
      contractReadableStrikeDepositAmounts[index] &&
      contractReadableStrikeDepositAmounts[index].gt('0')
  );
  // Handle Deposit
  const handleDeposit = useCallback(async () => {
    let currentToken;
    if (denominationTokenName === 'USDT') {
      currentToken = usdtAddress;
    } else if (denominationTokenName === 'USDC') {
      currentToken = usdcAddress;
    } else if (denominationTokenName === '2CRV') {
      currentToken = crv2Address;
    }

    try {
      const strikeIndexes = selectedStrikeIndexes.filter(
        (index) =>
          contractReadableStrikeDepositAmounts[index] &&
          contractReadableStrikeDepositAmounts[index].gt('0')
      );
      if (denominationTokenName === '2CRV') {
        console.log('direct with contract');
        await sendTx(
          ssovContractWithSigner.depositMultiple(
            strikeIndexes,
            strikeIndexes.map((index) =>
              getContractReadableAmount(
                strikeDepositAmounts[index],
                getDecimalsFromSymbol(denominationTokenName, chainId)
              )
            ),
            accountAddress
          )
        );
      } else if (
        denominationTokenName === 'USDT' ||
        denominationTokenName === 'USDC'
      ) {
        await sendTx(
          ssovRouter.swapAndDepositMultipleFromSingle(
            getContractReadableAmount(
              totalDepositAmount,
              getDecimalsFromSymbol(denominationTokenName, chainId)
            ),
            currentToken,
            strikeIndexes,
            strikeIndexes.map((index) =>
              ethers.utils
                .parseEther(strikeDepositAmounts[index].toString())
                .sub(
                  ethers.utils.parseEther(
                    (
                      parseInt(strikeDepositAmounts[index].toString()) * 0.01
                    ).toString()
                  )
                )
            ),
            accountAddress,
            ssovProperties.ssovContract.address
          )
        );
      }

      setStrikeDepositAmounts(() => ({}));
      setSelectedStrikeIndexes(() => []);
      updateAssetBalances();
      updateSsovData();
      updateUserSsovData();
    } catch (err) {
      console.log(err);
    }
  }, [
    selectedStrikeIndexes,
    ssovContractWithSigner,
    contractReadableStrikeDepositAmounts,
    updateSsovData,
    updateUserSsovData,
    updateAssetBalances,
    accountAddress,
    denominationTokenName,
    sendTx,
    ssovProperties.ssovContract.address,
    strikeDepositAmounts,
    ssovRouter,
    totalDepositAmount,
    chainId,
  ]);

  const checkDEXAggregatorStatus = useCallback(async () => {
    try {
      const { status } = await axios.get(
        `https://api.1inch.exchange/v4.0/${chainId}/healthcheck`
      );
      setIsZapInAvailable(
        !!(status === 200 && (erc20SSOV1inchRouter || nativeSSOV1inchRouter))
      );
    } catch (err) {
      setIsZapInAvailable(false);
    }
  }, [erc20SSOV1inchRouter, chainId, nativeSSOV1inchRouter]);

  useEffect(() => {
    checkDEXAggregatorStatus();
  }, [checkDEXAggregatorStatus]);

  useEffect(() => {
    handleTokenChange();
  }, [token, handleTokenChange]);

  // Handles isApproved
  useEffect(() => {
    if (!token || !ssovContractWithSigner || !ssovRouter || !accountAddress)
      return;

    let currentToken;
    if (denominationTokenName === 'USDT') {
      currentToken = usdtAddress;
    } else if (denominationTokenName === 'USDC') {
      currentToken = usdcAddress;
    } else if (denominationTokenName === '2CRV') {
      currentToken = crv2Address;
    }
    (async function () {
      const finalAmount = getContractReadableAmount(
        totalDepositAmount.toString(),
        getDecimalsFromSymbol(ssovTokenName, chainId)
      );
      let _token = ERC20__factory.connect(currentToken, provider);
      let userAmount = await _token.balanceOf(accountAddress);

      setUserTokenBalance(userAmount);

      let allowance = await _token.allowance(
        accountAddress,
        denominationTokenName === '2CRV'
          ? ssovContractWithSigner.address
          : ssovRouter.address
      );
      if (finalAmount.lte(allowance) && !allowance.eq(0)) {
        setApproved(true);
      } else {
        console.log(allowance.toString());
        setApproved(false);
      }
    })();
  }, [
    accountAddress,
    totalDepositAmount,
    token,
    ssovContractWithSigner,
    userAssetBalances.ETH,
    tokenName,
    chainId,
    spender,
    ssovTokenName,
    denominationTokenName,
    provider,
    ssovRouter,
  ]);

  return (
    <Box
      className={cx(
        'bg-cod-gray sm:px-4 px-2 py-4 rounded-xl pt-4',
        styles.cardWidth
      )}
    >
      <Tabs activeIndex={activeIndex} panelIscroll={false}>
        {['deposit', 'withdraw'].includes(activeTab) && (
          <Box className={isZapInVisible ? 'hidden' : 'flex'}>
            <Box className={isZapActive ? 'w-2/3 mr-2' : 'w-full'}>
              <Box className="flex flex-row mb-4 justify-between p-1 border-[1px] border-[#1E1E1E] rounded-md">
                <Box
                  className={
                    activeTab === 'deposit'
                      ? 'text-center w-1/2 pt-0.5 pb-1 bg-[#2D2D2D] cursor-pointer group rounded hover:bg-mineshaft hover:opacity-80'
                      : 'text-center w-1/2 pt-0.5 pb-1 cursor-pointer group rounded hover:opacity-80'
                  }
                  onClick={() => setActiveTab('deposit')}
                >
                  <Typography variant="h6" className="text-xs font-normal">
                    Deposit
                  </Typography>
                </Box>
                <Box
                  className={
                    activeTab === 'withdraw'
                      ? 'text-center w-1/2 pt-0.5 pb-1 bg-[#2D2D2D] cursor-pointer group rounded hover:bg-mineshaft hover:opacity-80'
                      : 'text-center w-1/2 pt-0.5 pb-1 cursor-pointer group rounded hover:opacity-80'
                  }
                  onClick={() =>
                    isVaultReady === true ? setActiveTab('withdraw') : ''
                  }
                >
                  <Typography variant="h6" className="text-xs font-normal">
                    Withdraw
                  </Typography>
                </Box>
              </Box>
            </Box>
            {!isZapActive ? (
              <Box className="w-1/3">
                <ZapOutButton
                  isZapActive={isZapActive}
                  handleClick={() => {
                    if (IS_NATIVE(ssovTokenName)) setToken(ssovTokenName);
                    else setToken(ssovToken);
                  }}
                />
              </Box>
            ) : null}
          </Box>
        )}

        <PanelList style={{ height: 32 + extraHeight + 'rem' }}>
          <Panel>
            <Box>
              <Box className="rounded-lg p-3 pt-2.5 pb-0 border border-neutral-800 w-full bg-umbra">
                <Box className="flex">
                  <Typography
                    variant="h6"
                    className="text-stieglitz ml-0 mr-auto text-[0.72rem]"
                  >
                    Balance
                  </Typography>
                  <Typography
                    variant="h6"
                    className="text-white ml-auto mr-0 text-[0.72rem]"
                  >
                    {denominationTokenName !== ssovTokenName
                      ? getUserReadableAmount(
                          userAssetBalances[denominationTokenName],
                          getDecimalsFromSymbol(denominationTokenName, chainId)
                        )
                      : purchasePower}{' '}
                    {denominationTokenName}
                  </Typography>
                  {isZapActive ? (
                    <ZapIcon className={'mt-1 ml-2'} id="4" />
                  ) : null}
                </Box>
                <Box className="mt-2 flex">
                  <Box className={isZapActive ? 'w-3/4 mr-3' : 'w-full'}>
                    <Select
                      className="bg-mineshaft hover:bg-mineshaft hover:opacity-80 rounded-md px-2 text-white"
                      fullWidth
                      multiple
                      displayEmpty
                      disableUnderline
                      value={selectedStrikeIndexes}
                      onChange={handleSelectStrikes}
                      input={<Input />}
                      variant="outlined"
                      renderValue={() => {
                        return (
                          <Typography
                            variant="h6"
                            className="text-white text-center w-full relative"
                          >
                            Select Strike Prices
                          </Typography>
                        );
                      }}
                      MenuProps={SelectMenuProps}
                      classes={{
                        icon: isZapActive
                          ? 'absolute right-7 text-white scale-x-75'
                          : 'absolute right-16 text-white scale-x-75',
                        select: 'overflow-hidden',
                      }}
                      label="strikes"
                    >
                      {strikes.map((strike, index) => (
                        <MenuItem
                          key={index}
                          value={index}
                          className="pb-2 pt-2"
                        >
                          <Checkbox
                            className={
                              selectedStrikeIndexes.indexOf(index) > -1
                                ? 'p-0 text-white'
                                : 'p-0 text-white border'
                            }
                            checked={selectedStrikeIndexes.indexOf(index) > -1}
                          />
                          <Typography
                            variant="h5"
                            className="text-white text-left w-full relative ml-3"
                          >
                            ${formatAmount(strike, 4)}
                          </Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  {isZapActive ? (
                    <Box className="w-1/4">
                      <Select
                        className="bg-mineshaft hover:bg-mineshaft hover:opacity-80 rounded-md px-2 text-white"
                        fullWidth
                        displayEmpty
                        disableUnderline
                        value={[denominationTokenName]}
                        onChange={(e) => {
                          const symbol = e.target.value;
                          setDenomationTokenName(symbol.toString());
                        }}
                        input={<Input />}
                        variant="outlined"
                        renderValue={() => {
                          return (
                            <Typography
                              variant="h6"
                              className="text-white text-center w-full relative"
                            >
                              {denominationTokenName}
                            </Typography>
                          );
                        }}
                        MenuProps={SelectMenuProps}
                        classes={{
                          icon: 'absolute right-1 text-white scale-x-75',
                          select: 'overflow-hidden',
                        }}
                        label="tokens"
                      >
                        <MenuItem
                          key={'USDC'}
                          value={'USDC'}
                          className="pb-2 pt-2"
                        >
                          <Checkbox
                            className={
                              denominationTokenName.toUpperCase() === 'USDC'
                                ? 'p-0 text-white'
                                : 'p-0 text-white border'
                            }
                            checked={
                              denominationTokenName.toUpperCase() === 'USDC'
                            }
                          />
                          <Typography
                            variant="h5"
                            className="text-white text-left w-full relative ml-3"
                          >
                            {'USDC'}
                          </Typography>
                        </MenuItem>
                        <MenuItem
                          key={'USDT'}
                          value={'USDT'}
                          className="pb-2 pt-2"
                        >
                          <Checkbox
                            className={
                              denominationTokenName.toUpperCase() === 'USDT'
                                ? 'p-0 text-white'
                                : 'p-0 text-white border'
                            }
                            checked={
                              denominationTokenName.toUpperCase() === 'USDT'
                            }
                          />
                          <Typography
                            variant="h5"
                            className="text-white text-left w-full relative ml-3"
                          >
                            {'USDT'}
                          </Typography>
                        </MenuItem>
                        <MenuItem
                          key={'2CRV'}
                          value={'2CRV'}
                          className="pb-2 pt-2"
                        >
                          <Checkbox
                            className={
                              denominationTokenName.toUpperCase() === '2CRV'
                                ? 'p-0 text-white'
                                : 'p-0 text-white border'
                            }
                            checked={
                              denominationTokenName.toUpperCase() === '2CRV'
                            }
                          />
                          <Typography
                            variant="h5"
                            className="text-white text-left w-full relative ml-3"
                          >
                            {'2CRV'}
                          </Typography>
                        </MenuItem>
                      </Select>
                    </Box>
                  ) : null}
                </Box>
                <Box className="mt-3">
                  {selectedStrikeIndexes.map((index) => (
                    <Box className="flex mb-3 group" key={index}>
                      <Button
                        className="p-2 pl-4 pr-4 bg-mineshaft text-white hover:bg-mineshaft hover:opacity-80 font-normal cursor-pointer"
                        disableRipple
                        onClick={() => unselectStrike(index)}
                      >
                        ${formatAmount(strikes[index], 4)}
                        <TransparentCrossIcon className="ml-2" />
                      </Button>
                      <ArrowRightIcon className="ml-4 mt-2.5" />

                      <Box className="ml-auto mr-0">
                        <Input
                          disableUnderline={true}
                          name="address"
                          className="w-[11.3rem] lg:w-[9.3rem] border-[#545454] border-t-[1.5px] border-b-[1.5px] border-l-[1.5px] border-r-[1.5px] rounded-md pl-2 pr-2"
                          classes={{ input: 'text-white text-xs text-right' }}
                          value={strikeDepositAmounts[index]}
                          placeholder="0"
                          onChange={(e) => inputStrikeDepositAmount(index, e)}
                        />
                        <Box
                          className="absolute left-[10.2rem] mt-[-1.45rem] hidden hover:opacity-90 group-hover:block"
                          onClick={() =>
                            inputStrikeDepositAmount(
                              index,
                              null,
                              parseFloat(
                                (denominationTokenName !== ssovTokenName
                                  ? getUserReadableAmount(
                                      userAssetBalances[denominationTokenName],
                                      18
                                    )
                                  : purchasePower * 0.99
                                ).toFixed(4)
                              )
                            )
                          }
                        >
                          <img
                            src="/assets/max.svg"
                            alt="MAX"
                            className="cursor-pointer"
                          />
                        </Box>
                        <Box
                          className="absolute left-[12.4rem] mt-[-1.45rem] hidden hover:opacity-90 group-hover:block"
                          onClick={() =>
                            inputStrikeDepositAmount(
                              index,
                              null,
                              parseFloat(
                                (denominationTokenName !== ssovTokenName
                                  ? getUserReadableAmount(
                                      userAssetBalances[denominationTokenName],
                                      18
                                    ) / 2
                                  : purchasePower / 2
                                ).toFixed(4)
                              )
                            )
                          }
                        >
                          <img
                            src="/assets/half.svg"
                            alt="half"
                            className="cursor-pointer"
                          />
                        </Box>
                        <Box
                          className="absolute left-[13.8rem] mt-[-1.45rem] hidden hover:opacity-90 group-hover:block"
                          onClick={() =>
                            inputStrikeDepositAmount(
                              index,
                              null,
                              parseFloat(
                                (denominationTokenName !== ssovTokenName
                                  ? getUserReadableAmount(
                                      userAssetBalances[denominationTokenName],
                                      18
                                    ) / 3
                                  : purchasePower / 3
                                ).toFixed(4)
                              )
                            )
                          }
                        >
                          <img
                            src="/assets/third.svg"
                            alt="third"
                            className="cursor-pointer"
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box className="mt-3.5">
                <Box className={'flex'}>
                  <Box className="rounded-tl-xl flex p-3 border border-neutral-800 w-full">
                    <Box className={'w-5/6'}>
                      <Typography variant="h5" className="text-white pb-1 pr-2">
                        {userEpochDepositsAmount !== '0'
                          ? formatAmount(userEpochDepositsAmount, 4)
                          : '-'}
                      </Typography>
                      <Typography
                        variant="h6"
                        className="text-stieglitz pb-1 pr-2"
                      >
                        Deposit
                      </Typography>
                    </Box>
                  </Box>
                  <Box className="rounded-tr-xl flex flex-col p-3 border border-neutral-800 w-full">
                    <Typography variant="h5" className="text-white pb-1 pr-2">
                      {vaultShare > 0 ? formatAmount(vaultShare, 4) + '%' : '-'}
                    </Typography>
                    <Typography
                      variant="h6"
                      className="text-stieglitz pb-1 pr-2"
                    >
                      Vault Share
                    </Typography>
                  </Box>
                </Box>

                <Box className="rounded-bl-xl rounded-br-xl flex flex-col mb-0 p-3 border border-neutral-800 w-full">
                  <Box className={'flex mb-1'}>
                    <Typography
                      variant="h6"
                      className="text-stieglitz ml-0 mr-auto"
                    >
                      Epoch
                    </Typography>
                    <Box className={'text-right'}>
                      <Typography
                        variant="h6"
                        className="text-white mr-auto ml-0"
                      >
                        {ssovProperties.selectedEpoch}
                      </Typography>
                    </Box>
                  </Box>
                  <Box className={'flex mb-1'}>
                    <Typography
                      variant="h6"
                      className="text-stieglitz ml-0 mr-auto"
                    >
                      Withdrawable
                    </Typography>
                    <Box className={'text-right'}>
                      <Typography
                        variant="h6"
                        className="text-white mr-auto ml-0"
                      >
                        {epochTimes[1]
                          ? format(new Date(epochTimes[1] * 1000), 'd LLL yyyy')
                          : '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box className="rounded-xl p-4 border border-neutral-800 w-full bg-umbra mt-4">
                <Box className="rounded-md flex flex-col mb-2.5 p-4 pt-2 pb-2.5 border border-neutral-800 w-full bg-neutral-800">
                  <EstimatedGasCostButton gas={500000} chainId={chainId} />
                </Box>
                <ZapInButton
                  openZapIn={openZapIn}
                  isZapActive={isZapActive}
                  quote={quote}
                  path={{ error: true }}
                  isFetchingPath={isFetchingPath}
                  tokenName={tokenName}
                  ssovTokenSymbol={ssovTokenSymbol}
                  selectedTokenPrice={selectedTokenPrice}
                  isZapInAvailable={isZapInAvailable}
                  chainId={chainId}
                />
                <Box className="flex">
                  <Box className="flex text-center p-2 mr-2 mt-1">
                    <LockerIcon />
                  </Box>
                  {!isDepositWindowOpen ? (
                    <Typography variant="h6" className="text-stieglitz">
                      Deposits for Epoch {ssovProperties.currentEpoch + 1} will
                      open on
                      <br />
                      <span className="text-white">
                        {epochTimes[1]
                          ? format(
                              new Date(epochTimes[1] * 1000),
                              'd LLLL yyyy'
                            )
                          : '-'}
                      </span>
                    </Typography>
                  ) : (
                    <Typography variant="h6" className="text-stieglitz">
                      Withdrawals are locked until end of Epoch{' '}
                      {ssovProperties.currentEpoch + 1} {'   '}
                      <span className="text-white">
                        {epochTimes[1]
                          ? format(
                              new Date(epochTimes[1] * 1000),
                              'd LLLL yyyy'
                            )
                          : '-'}
                      </span>
                    </Typography>
                  )}
                </Box>
                <CustomButton
                  size="medium"
                  className="w-full mt-4 !rounded-md"
                  color={
                    isDepositWindowOpen && totalDepositAmount > 0
                      ? 'primary'
                      : 'mineshaft'
                  }
                  disabled={!isDepositWindowOpen || totalDepositAmount <= 0}
                  onClick={approved ? handleDeposit : handleApprove}
                >
                  {!isDepositWindowOpen && isVaultReady && (
                    <Countdown
                      date={new Date(epochTimes[1] * 1000)}
                      renderer={({ days, hours, minutes }) => (
                        <Box className="text-stieglitz flex">
                          <WhiteLockerIcon className="mr-2" />

                          <span className="opacity-70">
                            {days}D {hours}H {minutes}M
                          </span>
                        </Box>
                      )}
                    />
                  )}
                  {isDepositWindowOpen
                    ? approved
                      ? totalDepositAmount > 0
                        ? 'Deposit'
                        : 'Insert an amount'
                      : 'Approve'
                    : 'Deposits are closed'}
                </CustomButton>
              </Box>
            </Box>
          </Panel>
          <Panel>
            <Withdraw ssovProperties={ssovProperties} />
          </Panel>
          <Panel>
            <ZapIn
              setOpen={setIsZapInVisible}
              ssovTokenName={ssovTokenName}
              tokenName={tokenName}
              setToken={setToken}
              token={token}
              userTokenBalance={userTokenBalance}
              quote={quote}
              setSlippageTolerance={setSlippageTolerance}
              slippageTolerance={slippageTolerance}
              purchasePower={purchasePower}
              selectedTokenPrice={selectedTokenPrice}
              isInDialog={false}
              ssovToken={ssovToken}
            />
          </Panel>
        </PanelList>
      </Tabs>
    </Box>
  );
};

export default ManageCard;