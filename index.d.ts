type ActionButton = {
  title?: string;
  description: string;
  iconPath: string;
  action: any;
};

type Transfer = {
  type: string;
  ts: string;
  value: string;
  from: string;
  to: string;
};

type ActionType = "SHARE_GLO" | "BUY_GLO_MERCH" | "JOIN_PROGRAM";

type Action = {
  type: ActionType;
};
