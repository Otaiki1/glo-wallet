import { useEffect } from "react";
import { useAccount, useBalance, useNetwork } from "wagmi";

import Balance from "@/components/Balance";
import CTA from "@/components/CTA";
import Header from "@/components/Header";
import Transactions from "@/components/Transactions";
import { getSmartContractAddress } from "@/lib/config";
import { useUserStore } from "@/lib/store";
import { api, initApi } from "@/lib/utils";
import { torusPlugin } from "@/lib/web3uath";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: balance } = useBalance({
    address,
    token: getSmartContractAddress(chain?.id),
  });

  const { setTransfers, setCTAs } = useUserStore();

  useEffect(() => {
    if (isConnected) {
      initApi(address!).then(async () => {
        const { data: ctas } = await api().get<CTA[]>(`/ctas`);
        setCTAs(ctas);

        const { data: transfers } = await api().get<Transfer[]>(
          `/transfers/${chain?.id}`
        );
        setTransfers(transfers);
      });
    }
  }, [isConnected]);

  return (
    <div className="mt-4 px-2.5">
      <Header address={address} isConnected={isConnected} />
      <div className="flex flex-col space-y-10">
        <Balance balance={balance} />
        <Transactions />
        <CTA />
      </div>
    </div>
  );
}
