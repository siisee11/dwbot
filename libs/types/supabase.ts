export type CheckType = "vacation" | "checkin";

export type DailyCheck = {
  id: string;
  challenge_id: string;
  slack_user_id: string;
  created_at: string;
  check_type: CheckType;
};

export type Challenge = {
  id: string;
  created_at: string;
  channel_id: string;
  name: string;
  cutoff_hour: number;
  vacation_per_month: number;
};
