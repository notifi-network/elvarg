import { TableRow } from '@mui/material';

import { ISpreadPair, OptionsTableData } from 'store/Vault/zdte';

import {
  StyleCell,
  StyleLeftCell,
  StyleLeftTableCell,
  StyleRightCell,
  StyleRightTableCell,
  StyleTableCellHeader,
} from 'components/common/LpCommon/Table';
import OptionsTableButton from 'components/zdte/OptionsTable/OptionsTableButton';

import { formatAmount } from 'utils/general';

export const FormatDollarColor = ({ value }: { value: number }) => {
  const formatedVal = Number(formatAmount(Math.abs(value), 2));
  if (value > 0) {
    return <p className="text-sm text-up-only">{`$${formatedVal}`}</p>;
  } else if (value < 0) {
    return (
      <p className="text-sm text-down-bad">{`-$${Math.abs(formatedVal)}`}</p>
    );
  } else {
    return <p className="text-sm text-white">{`$${formatedVal}`}</p>;
  }
};

export const FormatPercentColor = ({ value }: { value: number }) => {
  if (value > 0) {
    return <p className="text-sm text-up-only">{`${value}%`}</p>;
  } else if (value < 0) {
    return <p className="text-sm text-down-bad">{`-${Math.abs(value)}%`}</p>;
  } else {
    return <p className="text-sm text-white">{`${value}%`}</p>;
  }
};

export function addZeroes(num: string) {
  if (Number(num) > 10) return num;
  const dec = num.split('(.|,)')[1];
  const len = dec && dec.length > 2 ? dec.length : 2;
  return Number(num).toFixed(len);
}

export const OptionsTableRow = ({
  tokenPrice,
  optionsStats,
  selectedSpreadPair,
  idx,
  handleSelectLongStrike,
}: {
  tokenPrice: number;
  optionsStats: OptionsTableData;
  selectedSpreadPair: ISpreadPair | undefined;
  idx: number;
  handleSelectLongStrike: (longStrike: number) => void;
}) => {
  return (
    <TableRow key={idx} className="text-white mb-2 rounded-lg">
      <StyleLeftCell align="left">
        <div className="flex flex-row items-center w-max">
          <h6 className="text-white capitalize">
            <span>
              $
              {optionsStats.strike > 10
                ? formatAmount(optionsStats.strike)
                : addZeroes(formatAmount(optionsStats.strike, 2))}
            </span>
          </h6>
        </div>
      </StyleLeftCell>
      <StyleCell align="left">
        <h6>
          <span className="text-white">
            {`${
              optionsStats.premium === '...'
                ? '...'
                : `$${optionsStats.premium}`
            }`}
          </span>
        </h6>
      </StyleCell>
      <StyleCell align="left">
        <h6>
          <span className="text-white">{optionsStats.iv}</span>
        </h6>
      </StyleCell>
      <StyleCell align="left">
        <h6>
          <span className="text-white">
            {`${
              optionsStats.premium === '...'
                ? '...'
                : formatAmount(optionsStats.delta, 4)
            }`}
          </span>
        </h6>
      </StyleCell>
      <StyleRightCell align="right" className="pt-2">
        <OptionsTableButton
          tokenPrice={tokenPrice}
          optionsStats={optionsStats}
          selectedSpreadPair={selectedSpreadPair}
          handleSelectLongStrike={handleSelectLongStrike}
        />
      </StyleRightCell>
    </TableRow>
  );
};

export const OptionsTableRowLower = ({
  tokenPrice,
  optionsStats,
  selectedSpreadPair,
  idx,
  handleSelectLongStrike,
}: {
  tokenPrice: number;
  optionsStats: OptionsTableData;
  selectedSpreadPair: ISpreadPair | undefined;
  idx: number;
  handleSelectLongStrike: (longStrike: number) => void;
}) => {
  return (
    <TableRow key={idx} className="text-white mb-2 rounded-lg">
      <StyleLeftTableCell align="left">
        <div className="flex flex-row items-center w-max">
          <h6 className="text-white capitalize">
            <span>
              $
              {optionsStats.strike > 10
                ? formatAmount(optionsStats.strike)
                : addZeroes(formatAmount(optionsStats.strike, 2))}
            </span>
          </h6>
        </div>
      </StyleLeftTableCell>
      <StyleTableCellHeader>
        <h6>
          <span className="text-white">
            {`${
              optionsStats.premium === '...'
                ? '...'
                : `$${optionsStats.premium}`
            }`}
          </span>
        </h6>
      </StyleTableCellHeader>
      <StyleTableCellHeader>
        <h6>
          <span className="text-white">{optionsStats.iv}</span>
        </h6>
      </StyleTableCellHeader>
      <StyleTableCellHeader>
        <h6>
          <span className="text-white">
            {`${
              optionsStats.premium === '...'
                ? '...'
                : formatAmount(optionsStats.delta, 4)
            }`}
          </span>
        </h6>
      </StyleTableCellHeader>
      <StyleRightTableCell align="right" className="pt-2">
        <OptionsTableButton
          tokenPrice={tokenPrice}
          optionsStats={optionsStats}
          selectedSpreadPair={selectedSpreadPair}
          handleSelectLongStrike={handleSelectLongStrike}
        />
      </StyleRightTableCell>
    </TableRow>
  );
};
