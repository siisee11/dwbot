export type DailyCheck = {
  id: string;
  challenge_id: string;
  slack_user_id: string;
  created_at: string;
};

export type Challenge = {
  id: string;
  created_at: string;
  channel_id: string;
  name: string;
  cutoff_hour: number;
};
