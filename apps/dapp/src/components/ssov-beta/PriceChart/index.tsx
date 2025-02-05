import { useEffect, useRef } from 'react';

import { Skeleton } from '@dopex-io/ui';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ColorType, createChart } from 'lightweight-charts';

import { TOKEN_DATA } from 'constants/tokens';

const PriceChart = ({ market }: { market: string }) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const query = useQuery({
    queryFn: () =>
      axios.get(
        `https://api.coingecko.com/api/v3/coins/${TOKEN_DATA[market].cgId}/market_chart?vs_currency=usd&days=30`,
      ),
    queryKey: [market, 'coingecko-historic-pricing'],
  });

  useEffect(() => {
    if (!chartContainerRef.current || query.isFetching) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      height: 500,
      layout: {
        background: {
          type: ColorType.Solid,
          color: 'black',
        },
        textColor: '#D9D9D9',
      },
      watermark: {
        color: 'rgba(0, 0, 0, 0)',
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          color: 'false',
        },
      },
    });

    chart.timeScale().fitContent();

    const areaSeries = chart.addAreaSeries({
      topColor: 'rgba(33, 150, 243, 0.56)',
      bottomColor: 'rgba(33, 150, 243, 0.04)',
      lineColor: 'rgba(33, 150, 243, 1)',
      lineWidth: 2,
    });

    const data = query?.data?.data.prices.map((price: any) => {
      return {
        time: Number((price[0] / 1000).toFixed(0)),
        value: price[1],
      };
    });

    areaSeries.setData(data);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [query]);

  if (query.isFetching) {
    return <Skeleton width={950} height={500} />;
  }

  return <div ref={chartContainerRef} className="m-3 rounded-xl h-full" />;
};

export default PriceChart;
