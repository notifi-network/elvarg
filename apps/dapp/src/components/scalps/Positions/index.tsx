import { useState } from 'react';

import ButtonGroup from '@mui/material/ButtonGroup';

import { Button } from '@dopex-io/ui';
import { useBoundStore } from 'store';

import displayAddress from 'utils/general/displayAddress';

import PositionsTable from './PositionsTable';

const Positions = () => {
  const { accountAddress, ensName } = useBoundStore();
  const [activeTab, setActiveTab] = useState<string>('Open');

  return (
    <div className="text-gray-400 min-w-[60vw] rounded-lg">
      <div className="border rounded-t-xl border-cod-gray py-2 bg-umbra">
        <div className="flex ml-3">
          <div className="rounded-md bg-neutral-700 flex mb-2 mt-3 h-6">
            <span className="ml-auto p-1 text-white text-xs">
              {displayAddress(accountAddress, ensName)}
            </span>
          </div>
          <ButtonGroup className="flex w-32 justify-between bg-cod-gray border border-umbra rounded-lg mb-3 ml-auto mr-4 mt-1">
            {['Open', 'Closed'].map((label, index) => (
              <Button
                key={index}
                className={`border-0 hover:border-0 w-full m-1 p-1 transition ease-in-out duration-500 ${
                  activeTab === label
                    ? 'text-white bg-carbon hover:bg-carbon'
                    : 'text-stieglitz bg-transparent hover:bg-transparent'
                } hover:text-white`}
                onClick={() => setActiveTab(label)}
              >
                <span
                  className={`${activeTab === label && 'text-white'} text-xs`}
                >
                  {label}
                </span>
              </Button>
            ))}
          </ButtonGroup>
        </div>
      </div>
      <div className="border rounded-b-xl border-cod-gray border-t-neutral-800 bg-umbra">
        <PositionsTable tab={activeTab} />
      </div>
    </div>
  );
};

export default Positions;
