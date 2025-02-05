import Link from 'next/link';
import Box from '@mui/material/Box';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import IconButton from '@mui/material/IconButton';

import Typography from 'components/UI/Typography';
import PoolCardItem from 'components/atlantics/PoolCard/PoolCardItem';
import PutsIcon from 'svgs/icons/PutsIcon';
import CallsIcon from 'svgs/icons/CallsIcon';

import formatAmount from 'utils/general/formatAmount';

interface PoolCardProps {
  depositToken: string;
  underlying: string;
  duration: string | null;
  isPut: boolean;
  tvl: string;
  apy: string;
  retired: boolean;
  version: string | number;
}

const PoolCard = (props: PoolCardProps) => {
  const {
    depositToken,
    underlying,
    duration,
    isPut,
    tvl,
    apy,
    retired = false,
    version,
  } = props;
  const type: string = isPut ? 'PUTS' : 'CALLS';

  return (
    <Link
      href={`/atlantics/manage/${underlying}-${type}-${duration}${
        retired ? '?version=' + version : ''
      }`}
      passHref
    >
      <Box
        className="bg-umbra rounded-lg p-3 border border-umbra hover:border-primary transition ease-in-out hover:duration-250 flex-1"
        role="button"
      >
        <Box className="flex justify-between">
          <Box className="flex space-x-2">
            <img
              src={`/images/tokens/${depositToken.toLowerCase()}.svg`}
              alt={depositToken.toLowerCase()}
              className="h-[2rem] w-[2rem] border border-mineshaft rounded-full"
            />
            <Typography variant="h6" className=" ml=[3rem] my-auto">
              {`${underlying}-${type}-${duration}`}
            </Typography>
            {!isPut ? (
              <CallsIcon fill="#8aff95" className="my-auto" />
            ) : (
              <PutsIcon className="my-auto" />
            )}
          </Box>
          <IconButton className="p-0">
            <ArrowForwardRoundedIcon className="fill-current text-white" />
          </IconButton>
        </Box>
        <Box className="space-y-2 m-2 py-1">
          <PoolCardItem
            description="Epoch Length"
            value={duration ? duration.toUpperCase() : '--'}
          />
          <PoolCardItem
            description="TVL"
            value={'$' + formatAmount(tvl ?? 0, 2, true)}
          />
          <PoolCardItem
            description="APY"
            value={isNaN(Number(apy)) ? '-' : `${formatAmount(apy, 2)}%`}
          />
          {retired ? (
            <PoolCardItem
              description="Status"
              value={'RETIRED'}
              highlight="down-bad"
            />
          ) : null}
        </Box>
      </Box>
    </Link>
  );
};

export default PoolCard;
