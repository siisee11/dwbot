import { createClient } from "@supabase/supabase-js";

import { endOfMonth, getDate, getDay, startOfMonth } from "date-fns";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { makeSlackUserId, makeChallangeId } from "../../libs/utils/id.utils";
import type {
  Challenge,
  CheckType,
  DailyCheck,
  SlackUser,
} from "../../libs/types/supabase";
import {
  getDailyChecks,
  getTodayDailyChecksConsideringCutoff,
  insertDailyCheck,
} from "../../libs/services/daily-checks.service";
import { getMonthPeriodForNow } from "../../libs/services/challenges.service";
import { supabaseKey, supabaseUrl } from "../../libs/consts/supabase";
import { isAlreadyUsedAllVacationsError } from "../../libs/consts/errors";

export const generateCalendar = async (
  date: Date,
  dailyChecks: DailyCheck[],
  cutoffHour: number = 0
) => {
  const month = date.getMonth() + 1;
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const daysInMonth = end.getDate();
  const startDay = getDay(start);

  const checkDates = dailyChecks
    .filter((check) => check.check_type === "checkin")
    .map((check) => {
      const realDate = new Date(check.created_at);
      const cutoffAdjustedDate = new Date(realDate);
      cutoffAdjustedDate.setHours(realDate.getHours() - cutoffHour, 0, 0, 0); // if realDate is 09-01 23:00, and cutoffHoure is -4 than cutoffAdjustedDate will be 09-02 03:00
      return getDate(cutoffAdjustedDate);
    });

  const vacationDates = dailyChecks
    .filter((check) => check.check_type === "vacation")
    .map((check) => {
      const realDate = new Date(check.created_at);
      const cutoffAdjustedDate = new Date(realDate);
      cutoffAdjustedDate.setHours(realDate.getHours() - cutoffHour, 0, 0, 0); // if realDate is 09-01 23:00, and cutoffHoure is -4 than cutoffAdjustedDate will be 09-02 03:00
      return getDate(cutoffAdjustedDate);
    });

  // Calculate streak
  let streak = 0;
  let currentDate = new Date(end);
  currentDate.setHours(0, 0, 0, 0);
  while (
    checkDates.includes(currentDate.getDate()) ||
    vacationDates.includes(currentDate.getDate())
  ) {
    if (checkDates.includes(currentDate.getDate())) {
      streak++;
    }
    currentDate.setDate(currentDate.getDate() - 1);
    if (currentDate < start) break;
  }

  const streakEmoji = streak >= 7 ? "🔥" : "";
  let calendar = [
    `${month}월 (연속 ${streak}일 ${streakEmoji})`,
    "일  월  화  수  목  금  토",
  ];
  let week = Array(startDay).fill("---"); // Fill initial spaces for the first week

  for (let i = 1; i <= daysInMonth; i++) {
    const day = i.toString().padStart(2, "0");
    if (checkDates.includes(i)) {
      week.push(":white_check_mark:");
    } else if (vacationDates.includes(i)) {
      week.push(":palm_tree:");
    } else {
      week.push(day);
    }

    if (week.length === 7 || i === daysInMonth) {
      calendar.push(week.join(" "));
      week = [];
    }
  }

  return calendar.join("\n");
};

// Function to get or create a Slack user
const getOrCreateSlackUser = async (
  userId: string,
  userName: string
): Promise<SlackUser> => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  let { data: user } = await supabase
    .from("slack_users")
    .select("*")
    .eq("slack_user_id", userId)
    .single();

  console.log("getOrCreateSlackUser::", user);

  if (user) {
    return user;
  } else {
    const { data, error } = await supabase
      .from("slack_users")
      .insert([
        {
          id: makeSlackUserId(),
          slack_user_id: userId,
          slack_user_name: userName,
        },
      ])
      .select("*")
      .single();

    if (error) {
      throw new Error("Error creating user");
    }

    return data;
  }
};

// Function to get or create a challenge
export const getOrCreateChallenge = async (
  channelId: string,
  channelName: string
): Promise<Challenge> => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  let { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("channel_id", channelId)
    .single();

  if (challenge) {
    return challenge;
  } else {
    const { data, error } = await supabase
      .from("challenges")
      .insert([
        {
          id: makeChallangeId(),
          channel_id: channelId,
          name: channelName,
        },
      ])
      .select("*")
      .single();

    if (error) {
      throw new Error("Error creating challenge");
    }

    return data;
  }
};

export const insertDailyCheckIfNotExists = async ({
  slackUser,
  challenge,
  checkType = "checkin",
}: {
  slackUser: any;
  challenge: Challenge;
  checkType?: CheckType;
}) => {
  const todayChecks = await getTodayDailyChecksConsideringCutoff({
    challengeId: challenge.id,
    slackUserId: slackUser.id,
    cutoffHour: challenge.cutoff_hour,
  });

  if (todayChecks!.length === 0) {
    // Check if no existing check found
    await insertDailyCheck({
      challengeId: challenge.id,
      slackUserId: slackUser.id,
      checkType,
      vacationPerMonth: challenge.vacation_per_month,
      cutoffHour: challenge.cutoff_hour,
    });
  }
};

async function createDailyCheckCalendar({
  slackUser,
  challenge,
}: {
  slackUser: SlackUser;
  challenge: Challenge;
}) {
  const { start, end } = getMonthPeriodForNow(challenge.cutoff_hour);
  const dailyChecks = await getDailyChecks({
    challengeId: challenge.id,
    userId: slackUser.id,
    start,
    end,
  });
  const calendar = await generateCalendar(
    new Date(),
    dailyChecks,
    challenge.cutoff_hour
  );
  calendar[0].concat(` (${slackUser.slack_user_name})`);
  return calendar;
}

export type DailyCheckRequest = {
  channel_id: string;
  user_id: string;
  user_name: string;
  channel_name: string;
  response_url: string;
  checkType: CheckType;
};

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  const body = request.body;
  console.log("daily-checks::", body);
  const {
    channel_id,
    user_id,
    user_name,
    channel_name,
    response_url,
    checkType,
  } = body as DailyCheckRequest;

  try {
    const slackUser = await getOrCreateSlackUser(user_id, user_name);
    const challenge = await getOrCreateChallenge(channel_id, channel_name);
    await insertDailyCheckIfNotExists({ slackUser, challenge, checkType });
    const calendar = await createDailyCheckCalendar({
      slackUser,
      challenge,
    });

    console.log("daily-checks::calendar::", calendar);

    const res = await fetch(response_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response_type: "in_channel",
        text: calendar,
      }),
    });

    response.status(200).send("Success!");
  } catch (e: unknown) {
    console.error("daily-checks::error::", e);

    if (isAlreadyUsedAllVacationsError(e)) {
      await fetch(response_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response_type: "in_channel",
          text: "이미 이번 달의 휴가를 모두 사용했어요! :sob:",
        }),
      });
      response.status(200).send("Success!");
    } else {
      response.status(500).send("Error!");
    }
  }
}
