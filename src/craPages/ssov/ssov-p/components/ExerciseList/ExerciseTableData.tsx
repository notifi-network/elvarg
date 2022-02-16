import { useCallback, useContext, useState, useEffect, useMemo } from 'react';
import { BigNumber, ethers } from 'ethers';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import { WalletContext } from 'contexts/Wallet';
import { SsovProperties, SsovData } from 'contexts/SsovPuts';

import CustomButton from 'components/UI/CustomButton';
import Typography from 'components/UI/Typography';
import InfoPopover from 'components/UI/InfoPopover';
import Transfer from '../Dialogs/Transfer';
import Settle from '../Dialogs/Settle';

import formatAmount from 'utils/general/formatAmount';
import getUserReadableAmount from 'utils/contracts/getUserReadableAmount';
import { SSOV_MAP } from 'constants/index';

interface ExerciseTableDataProps {
  strikeIndex: number;
  strikePrice: number;
  depositedAmount: number;
  purchasedAmount: number;
  settleableAmount: BigNumber;
  pnlAmount: BigNumber;
  totalPremiumsEarned: BigNumber;
  isSettleable: boolean;
  isPastEpoch: boolean;
  ssovProperties: SsovProperties;
  ssovData: SsovData;
}

const DIALOGS = {
  SETTLE: Settle,
  TRANSFER: Transfer,
};

const ExerciseTableData = (props: ExerciseTableDataProps) => {
  const {
    strikeIndex,
    strikePrice,
    depositedAmount,
    totalPremiumsEarned,
    purchasedAmount,
    settleableAmount,
    pnlAmount,
    isSettleable,
    isPastEpoch,
    ssovProperties,
    ssovData,
  } = props;

  const { contractAddresses, signer } = useContext(WalletContext);

  const tokenSymbol =
    SSOV_MAP[ssovProperties.tokenName].tokenSymbol === 'BNB'
      ? 'vBNB'
      : SSOV_MAP[ssovProperties.tokenName].tokenSymbol;

  const { selectedEpoch } = ssovProperties;
  const { epochStrikes, isEpochExpired } = ssovData;

  const [dialogState, setDialogState] = useState({
    open: false,
    type: 'SETTLE',
    ssovProperties: ssovProperties,
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = useCallback(
    () => setDialogState((prevState) => ({ ...prevState, open: false })),
    []
  );

  const handleTransfer = useCallback(
    () =>
      setDialogState({
        open: true,
        type: 'TRANSFER',
        ssovProperties: ssovProperties,
      }),
    [ssovProperties]
  );
  const handleSettle = useCallback(
    () =>
      setDialogState({
        open: true,
        type: 'SETTLE',
        ssovProperties: ssovProperties,
      }),
    [ssovProperties]
  );

  const handleClickMenu = useCallback(
    (event) => setAnchorEl(event.currentTarget),
    []
  );

  const handleCloseMenu = useCallback(() => setAnchorEl(null), []);

  const settleableBooleans = useMemo(() => {
    if (isEpochExpired) {
      if (isSettleable) {
        return {
          settleButtonDisable: false,
          settleButtonPrimaryColor: true,
        };
      } else {
        return {
          settleButtonDisable: true,
          settleButtonPrimaryColor: false,
        };
      }
    } else
      return {
        settleButtonDisable: true,
        settleButtonPrimaryColor: false,
      };
  }, [isEpochExpired, isSettleable]);

  const Dialog = DIALOGS[dialogState.type];

  return (
    <TableRow className="text-white bg-umbra mb-2 rounded-lg">
      <Dialog
        open={dialogState.open}
        handleClose={handleClose}
        strikeIndex={strikeIndex}
        ssovProperties={ssovProperties}
        token={tokenSymbol}
        settleableAmount={settleableAmount}
        className="rounded-xl"
      />
      <TableCell align="left">
        <Box className="h-12 flex flex-row items-center">
          <Box className="flex flex-row h-8 w-8 mr-2">
            <img
              src={SSOV_MAP[ssovProperties.tokenName].imageSrc}
              alt={tokenSymbol}
            />
          </Box>
          <Typography variant="h5" className="text-white">
            {tokenSymbol === 'vBNB' ? 'BNB' : tokenSymbol}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="left" className="mx-0 pt-2">
        <Typography variant="h6">${formatAmount(strikePrice, 5)}</Typography>
      </TableCell>
      <TableCell align="left" className="pt-2">
        <Typography variant="h6">
          {formatAmount(depositedAmount, 5)} {tokenSymbol}
        </Typography>
      </TableCell>
      <TableCell align="left" className="pt-2">
        <Typography variant="h6">{formatAmount(purchasedAmount, 5)}</Typography>
      </TableCell>
      <TableCell align="left" className="px-6 pt-2">
        <Typography variant="h6">
          {formatAmount(getUserReadableAmount(settleableAmount, 18), 5)}
        </Typography>
      </TableCell>
      <TableCell align="left" className="px-6 pt-2">
        <Typography variant="h6">
          {pnlAmount.gte(0)
            ? `${formatAmount(
                tokenSymbol === 'vBNB'
                  ? getUserReadableAmount(pnlAmount, 8)
                  : getUserReadableAmount(pnlAmount, 18),
                5
              )} ${tokenSymbol}`
            : `0 ${tokenSymbol}`}
        </Typography>
      </TableCell>
      <TableCell align="left" className="px-6 pt-2">
        <Typography variant="h6">
          {!totalPremiumsEarned.isZero()
            ? `${formatAmount(
                tokenSymbol === 'vBNB'
                  ? getUserReadableAmount(totalPremiumsEarned, 8)
                  : getUserReadableAmount(totalPremiumsEarned, 18),
                5
              )} ${tokenSymbol}`
            : `0 ${tokenSymbol}`}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Box className="flex justify-end">
          {!isEpochExpired && (
            <InfoPopover
              className="my-auto"
              id="settle-info"
              infoText="Settle is available only after expiry of this epoch."
            />
          )}
          <CustomButton
            size="medium"
            className="px-2"
            onClick={handleSettle}
            disabled={settleableBooleans.settleButtonDisable}
            color={
              settleableBooleans.settleButtonPrimaryColor
                ? 'primary'
                : 'cod-gray'
            }
          >
            Settle
          </CustomButton>
          <IconButton
            aria-label="more"
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={handleClickMenu}
            className="long-menu rounded-md bg-mineshaft mx-1 p-0 hover:bg-opacity-80 hover:bg-mineshaft flex"
          >
            <MoreVertIcon className="fill-current text-white" />
          </IconButton>
          <Box>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              classes={{ paper: 'bg-umbra' }}
            >
              <MenuItem
                key="transfer-options"
                onClick={handleTransfer}
                className="text-white"
                disabled={settleableAmount.eq(BigNumber.from(0))}
              >
                Transfer
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default ExerciseTableData;