import { Button } from '@dopex-io/ui';
import cx from 'classnames';

import { ISpreadPair, OptionsTableData } from 'store/Vault/zdte';

function isDisabled(
  tokenPrice: number,
  selectedSpreadPair: ISpreadPair | undefined,
  strike: number
): boolean {
  // nothing has been selected
  if (
    selectedSpreadPair === undefined ||
    selectedSpreadPair.longStrike === undefined
  ) {
    return false;
  }
  // both selected, only undo for short
  if (
    selectedSpreadPair.shortStrike &&
    selectedSpreadPair.longStrike &&
    selectedSpreadPair.shortStrike !== strike
  ) {
    return true;
  }
  // long and short both selected, undo for short
  else if (selectedSpreadPair.shortStrike === strike) {
    return false;
  }
  // long selected, short not selected, undo for long
  else if (
    selectedSpreadPair.shortStrike === undefined &&
    selectedSpreadPair.longStrike === strike
  ) {
    return false;
  }
  // if selected long <= mark price, only strike lower than long can be short
  else if (
    selectedSpreadPair.longStrike <= tokenPrice &&
    strike < selectedSpreadPair.longStrike
  ) {
    return false;
  }
  // if selected long >= mark price, only strike higher than long can be short
  else if (
    selectedSpreadPair.longStrike >= tokenPrice &&
    strike > selectedSpreadPair.longStrike
  ) {
    return false;
  }
  return true;
}

const getAction = (
  selectedSpreadPair: ISpreadPair | undefined,
  optionsStats: OptionsTableData,
  tokenPrice: number
) => {
  if (
    selectedSpreadPair === undefined ||
    selectedSpreadPair.longStrike === undefined
  )
    return optionsStats.strike > tokenPrice ? 'Long Call' : 'Long Put';
  selectedSpreadPair.longStrike;
  if (
    selectedSpreadPair.longStrike === optionsStats.strike ||
    selectedSpreadPair.shortStrike === optionsStats.strike
  )
    return 'Undo';
  return optionsStats.strike > tokenPrice ? 'Short Call' : 'Short Put';
};

const OptionsTableButton = ({
  tokenPrice,
  optionsStats,
  selectedSpreadPair,
  handleSelectLongStrike,
}: {
  tokenPrice: number;
  optionsStats: OptionsTableData;
  selectedSpreadPair: ISpreadPair | undefined;
  handleSelectLongStrike: (longStrike: number) => void;
}) => {
  const buttonStatus = isDisabled(
    tokenPrice,
    selectedSpreadPair,
    optionsStats.strike
  );
  const buttonAction = getAction(selectedSpreadPair, optionsStats, tokenPrice);

  return (
    <Button
      className={cx(
        'w-24 cursor-pointer text-white ',
        buttonAction === 'Undo' ? 'bg-umbra hover:bg-umbra' : '',
        buttonStatus ? 'bg-umbra' : ''
      )}
      disabled={
        buttonStatus ||
        (selectedSpreadPair?.longStrike === undefined && optionsStats.disable)
      }
      onClick={() => handleSelectLongStrike(optionsStats.strike)}
    >
      {buttonAction}
    </Button>
  );
};

export default OptionsTableButton;
