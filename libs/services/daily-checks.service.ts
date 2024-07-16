import { getSupabase } from "./supabase.service";
import { DailyCheck } from "../types/supabase";
import { makeDailyCheckId } from "../utils/id.utils";
import { getMonthPeriodForNow } from "./challenges.service";
import { AlreadyUsedAllVacationsError } from "../consts/errors";

export const insertDailyCheck = async ({
  challengeId,
  slackUserId,
  checkType,
  vacationPerMonth,
  cutoffHour,
}: {
  challengeId: string;
  slackUserId: string;
  checkType: string;
  vacationPerMonth: number;
  cutoffHour: number;
}): Promise<DailyCheck> => {
  // if checkType is 'vacation', we need to check if the user has already used vacation for the month
  if (checkType === "vacation") {
    const { start, end } = getMonthPeriodForNow(cutoffHour);
    const dailyChecks = await getDailyChecks({
      challengeId: challengeId,
      userId: slackUserId,
      start,
      end,
    });
    const usedVacations = dailyChecks.filter(
      (check) => check.check_type === "vacation"
    ).length;

    if (usedVacations >= vacationPerMonth) {
      throw new AlreadyUsedAllVacationsError(
        "You have already used all your vacations for the month"
      );
    }
  }

  const { data: check, error } = await getSupabase()
    .from("daily_checks")
    .insert([
      {
        id: makeDailyCheckId(),
        challenge_id: challengeId,
        slack_user_id: slackUserId,
        check_type: checkType,
      },
    ])
    .select("*")
    .single();

  if (error) {
    throw new Error("Error inserting daily check");
  }

  return check as DailyCheck;
};

export const getTodayDailyChecksConsideringCutoff = async ({
  challengeId,
  slackUserId,
  cutoffHour,
}: {
  challengeId: string;
  slackUserId: string;
  cutoffHour: number;
}): Promise<DailyCheck[]> => {
  const date = new Date();

  // Adjust the start and end of the current day based on the cutoff hour
  const startOfDay = new Date(
    date.setHours(0 + cutoffHour, 0, 0, 0)
  ).toISOString();
  const endOfDay = new Date(
    date.setHours(23 + cutoffHour, 59, 59, 999)
  ).toISOString();

  const { data: todayChecks, error: checkError } = await getSupabase()
    .from("daily_checks")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("slack_user_id", slackUserId)
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  if (checkError) {
    throw new Error("Error fetching daily checks");
  }
  return todayChecks as DailyCheck[];
};

export const getDailyChecks = async ({
  challengeId,
  userId,
  start,
  end,
}: {
  challengeId: string;
  userId: string;
  start: Date;
  end: Date;
}): Promise<DailyCheck[]> => {
  const { data: dailyChecks, error } = await getSupabase()
    .from("daily_checks")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("slack_user_id", userId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (error) {
    throw new Error("Error fetching daily checks");
  }
  return dailyChecks as DailyCheck[];
};
