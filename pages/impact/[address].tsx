import axios from "axios";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";

import DetailedEnoughToBuy from "@/components/DetailedEnoughToBuy";
import BuyGloModal from "@/components/Modals/BuyGloModal";
import UserAuthModal from "@/components/Modals/UserAuthModal";
import Navbar from "@/components/Navbar";
import { ModalContext } from "@/lib/context";
import { getAllowedChains, lastSliceAddress, sliceAddress } from "@/lib/utils";
import {
  getBalance,
  getTotalYield,
  getUSFormattedNumber,
  customFormatBalance,
} from "@/utils";

import { KVResponse } from "../api/transfers/first-glo/[address]";

export default function Impact() {
  const [isCopiedTooltipOpen, setIsCopiedTooltipOpen] = useState(false);

  const { openModal } = useContext(ModalContext);
  const router = useRouter();
  const { push } = router;
  const { address } = router.query;

  const [formattedBalance, setFormattedBalance] = useState<string>("0");
  const [yearlyYield, setYearlyYield] = useState<number>(0);
  const [yearlyYieldFormatted, setYearlyYieldFormatted] =
    useState<string>("$0");
  const [whenFirstGlo, setWhenFirstGlo] = useState<string>("");
  const [showBalanceDropdown, setShowBalanceDropdown] = useState(false);
  const [ethereumBalanceFormatted, setEthereumBalanceFormatted] = useState<{
    yearlyYield: number;
    yearlyYieldFormatted: string;
    dblFmtBalance: string;
    fmtBalanceDollarPart: string;
    fmtBalanceCentPart: string;
  }>();
  const [polygonBalanceFormatted, setPolygonBalanceFormatted] = useState<{
    yearlyYield: number;
    yearlyYieldFormatted: string;
    dblFmtBalance: string;
    fmtBalanceDollarPart: string;
    fmtBalanceCentPart: string;
  }>();
  const [celoBalanceFormatted, setCeloBalanceFormatted] = useState<{
    yearlyYield: number;
    yearlyYieldFormatted: string;
    dblFmtBalance: string;
    fmtBalanceDollarPart: string;
    fmtBalanceCentPart: string;
  }>();

  useEffect(() => {
    if (isCopiedTooltipOpen) {
      setTimeout(() => setIsCopiedTooltipOpen(false), 2000);
    }
  }, [isCopiedTooltipOpen]);
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        return;
      }

      const chains = getAllowedChains();

      const { polygonBalanceFormatted, polygonBalance } =
        await getPolygonBalance(address, chains);
      setPolygonBalanceFormatted(polygonBalanceFormatted);

      const { ethereumBalanceFormatted, ethereumBalance } =
        await getEthereumBalance(address, chains);
      setEthereumBalanceFormatted(ethereumBalanceFormatted);

      const { celoBalanceFormatted, celoBalance } = await getCeloBalance(
        address,
        chains
      );
      setCeloBalanceFormatted(celoBalanceFormatted);

      const decimals = BigInt(10 ** 18);
      const balance = polygonBalance
        .add(ethereumBalance)
        .add(celoBalance)
        .div(decimals)
        .toNumber();

      let yearlyYield = getTotalYield(balance);
      // round down to 0 when the yield isn't even $1
      if (yearlyYield < 1) {
        yearlyYield = 0;
      }

      setYearlyYield(yearlyYield);
      const yearlyYieldFormatted =
        yearlyYield > 0 ? `$0 - $${yearlyYield.toFixed(0)}` : "$0";
      setYearlyYieldFormatted(yearlyYieldFormatted);
      setFormattedBalance(getUSFormattedNumber(balance));
    };
    fetchBalance();
  }, [address]);

  useEffect(() => {
    const seeWhenFirstGloTransaction = async () => {
      if (!address) {
        return;
      }

      const addressToCheck = address as string;
      const { data } = await axios.get<KVResponse>(
        `/api/transfers/first-glo/${addressToCheck}`
      );
      const { dateFirstGlo } = data;
      if (dateFirstGlo) {
        setWhenFirstGlo(beautifyDate(new Date(dateFirstGlo)));
      }
    };
    seeWhenFirstGloTransaction();
  }, [address]);

  const openUserAuthModal = () => {
    openModal(<UserAuthModal />, "bg-transparent");
    push("/");
  };

  const supportedChains = [
    {
      name: "Ethereum",
      logo: "/ethereum-square-logo.svg",
      balance: ethereumBalanceFormatted,
    },
    {
      name: "Polygon",
      logo: "/polygon-matic-logo.svg",
      balance: polygonBalanceFormatted,
    },
    {
      name: "Celo",
      logo: "/celo-square-logo.svg",
      balance: celoBalanceFormatted,
    },
  ];

  return (
    <>
      <Head>
        <title>Glo Impact</title>
      </Head>
      <Navbar />
      <div className="mt-4 px-6">
        <div className="bg-white rounded-[20px] py-4">
          <div className="flex flex-col space-y-2 px-4 mb-4">
            <div className="flex flex-row font-semibold justify-start mb-4 hover:cursor-pointer">
              <Tooltip
                anchorId="copy-wallet-address"
                content="Copied!"
                noArrow={true}
                isOpen={isCopiedTooltipOpen}
                className="ml-16"
              />
              <div
                id="copy-wallet-address"
                className="flex text-xs items-center justify-start"
                onClick={() => {
                  navigator.clipboard.writeText(address as string);
                  setIsCopiedTooltipOpen(true);
                }}
              >
                <button className="primary-button w-16 h-16 p-2 text-sm text-pine-900/90 mr-4">
                  {address && lastSliceAddress(address)}
                </button>
                <div className="flex flex-col text-[14px] font-normal leading-normal text-pine-900/90">
                  <span>{sliceAddress(address as string, 4)}</span>
                  <span>{whenFirstGlo}</span>
                </div>
              </div>
            </div>
            <div className="text-normal pb-4">Owns</div>
            <div className="flex flex-row font-extrabold justify-start relative">
              <div
                className="flex flex-row text-[2.625rem] items-baseline cursor-pointer"
                onClick={() => {
                  setShowBalanceDropdown(!showBalanceDropdown);
                }}
              >
                <span
                  className="font-extrabold"
                  data-testid="formatted-balance"
                >
                  ${formattedBalance}{" "}
                </span>
                <span className="text-sm ml-1">Glo Dollar</span>
              </div>
              {showBalanceDropdown && (
                <div className="absolute top-10 z-10 mt-1 w-[280px] h-[120px] bg-white border-2 border-pine-400/90 rounded-lg">
                  <div className="h-4 w-4 bg-white border-white border-t-pine-400/90 border-r-pine-400/90 border-2 -rotate-45 transform origin-top-left translate-x-32"></div>

                  <div className="flex flex-col justify-center items-center">
                    {supportedChains.map((chain) => (
                      <div
                        key={chain.name}
                        className="flex flex-row align-middle text-[2.625rem] items-center justify-between w-[200px] mb-2"
                      >
                        <div className="text-sm text-pine-700/90 mb-1.5 w-1/6">
                          <Image
                            alt={`${chain.name} logo`}
                            src={chain.logo}
                            width={20}
                            height={20}
                          />
                        </div>
                        <div className="text-sm text-pine-700/90 mb-1.5 w-1/3">
                          {chain.name}
                        </div>
                        <div className="text-sm text-pine-700/90 mb-1.5 w-1/2 text-right">
                          ${chain?.balance?.dblFmtBalance}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div
            className="flex flex-col bg-impact-bg text-impact-fg rounded-[24px] mx-1 mb-1 px-4 pb-3 cursor-pointer"
            onClick={() => openModal(<BuyGloModal totalBalance={1000} />)}
            data-testid="simulateBuyGlo"
          >
            <div className="overflow-hidden">
              <div className="h-4 w-4 bg-white -rotate-45 transform origin-top-left translate-x-32"></div>
            </div>
            <div className="flex flex-col w-full justify-between items-start space-y-2">
              <span className="my-2">Creating basic income of</span>
              <div
                className="text-[2.625rem] leading-[2.625rem] break-all font-neuehaasgrotesk"
                data-testid="yearlyYieldFormatted"
              >
                {yearlyYieldFormatted}
                <span className="text-base">/ year</span>
              </div>
              <span className="text-xs text-[11px] py-4">
                Current impact on the lower end of this range because Glo Dollar{" "}
                <a
                  className="underline"
                  href="https://www.glodollar.org/articles/from-bootstrap-to-high-impact"
                  target="_blank"
                  rel="noreferrer"
                >
                  is bootstrapping
                </a>
                . Adoption helps grow impact.
              </span>
            </div>
          </div>
          <DetailedEnoughToBuy
            yearlyYield={yearlyYield}
            noImpactCopyText="Nothing."
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="font-normal leading-normal mt-3 mb-2">
            Help end extreme poverty
          </div>
          <button
            className="primary-button px-6"
            onClick={() => openUserAuthModal()}
          >
            Buy Glo Dollar
          </button>
        </div>
      </div>
    </>
  );
}

const beautifyDate = (date?: Date) => {
  if (!date) {
    return "";
  }

  const year = date.getFullYear().toString().slice(2);
  const month = date.toLocaleString("default", { month: "long" }).toLowerCase();

  return ` 🔆 ${month.toString().toLowerCase()} ‘${year}`;
};
async function getCeloBalance(
  address: string | string[],
  chains: { id: number | undefined }[]
) {
  const celoBalance = await getBalance(address as string, chains[2].id);
  const celoBalanceValue = BigInt(celoBalance.toString()) / BigInt(10 ** 18);
  const celoBalanceFormatted = customFormatBalance({
    decimals: 18,
    formatted: celoBalanceValue.toString(),
    symbol: "USDGLO",
    value: celoBalanceValue,
  });
  return { celoBalanceFormatted, celoBalance };
}

async function getEthereumBalance(
  address: string | string[],
  chains: { id: number | undefined }[]
) {
  const ethereumBalance = await getBalance(address as string, chains[1].id);
  const ethereumBalanceValue =
    BigInt(ethereumBalance.toString()) / BigInt(10 ** 18);
  const ethereumBalanceFormatted = customFormatBalance({
    decimals: 18,
    formatted: ethereumBalanceValue.toString(),
    symbol: "USDGLO",
    value: ethereumBalanceValue,
  });
  return { ethereumBalanceFormatted, ethereumBalance };
}

async function getPolygonBalance(
  address: string | string[],
  chains: { id: number | undefined }[]
) {
  const polygonBalance = await getBalance(address as string, chains[0].id);
  const polygonBalanceValue =
    BigInt(polygonBalance.toString()) / BigInt(10 ** 18);
  const polygonBalanceFormatted = customFormatBalance({
    decimals: 18,
    formatted: polygonBalanceValue.toString(),
    symbol: "USDGLO",
    value: polygonBalanceValue,
  });
  return { polygonBalanceFormatted, polygonBalance };
}
