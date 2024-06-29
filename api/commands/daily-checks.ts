import { createClient } from "@supabase/supabase-js";

import { endOfMonth, getDate, getDay, startOfMonth } from "date-fns";
import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  makeSlackUserId,
  makeChallangeId,
  makeDailyCheckId,
} from "../utils/id.utils";

const supabaseUrl = "https://opljpbyvufnvjisogaai.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type DailyCheck = {
  id: string;
  challenge_id: string;
  slack_user_id: string;
  created_at: string;
};

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

  const checkDates = dailyChecks.map((check) => {
    const realDate = new Date(check.created_at);
    const cutoffAdjustedDate = new Date(realDate);
    cutoffAdjustedDate.setHours(realDate.getHours() - cutoffHour, 0, 0, 0); // if realDate is 09-01 23:00, and cutoffHoure is -4 than cutoffAdjustedDate will be 09-02 03:00
    return getDate(cutoffAdjustedDate);
  });

  let calendar = [`${month}월`, "일  월  화  수  목  금  토"];
  let week = Array(startDay).fill("---"); // Fill initial spaces for the first week

  for (let i = 1; i <= daysInMonth; i++) {
    const day = i.toString().padStart(2, "0");
    if (checkDates.includes(i)) {
      week.push(":white_check_mark:");
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

const getDailyChecks = async ({
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
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: dailyChecks, error } = await supabase
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

// Function to get or create a Slack user
const getOrCreateSlackUser = async (userId: string, userName: string) => {
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
const getOrCreateChallenge = async (channelId: string, channelName: string) => {
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

async function createDailyCheckCalendar({
  slackUser,
  challenge,
}: {
  slackUser: any;
  challenge: any;
}) {
  const date = new Date();
  const cutoffHour: number = challenge.cutoff_hour;

  // Adjust the start and end of the current day based on the cutoff hour
  const startOfDay = new Date(
    date.setHours(0 + cutoffHour, 0, 0, 0)
  ).toISOString();
  const endOfDay = new Date(
    date.setHours(23 + cutoffHour, 59, 59, 999)
  ).toISOString();

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: existingChecks, error: checkError } = await supabase
    .from("daily_checks")
    .select("*")
    .eq("challenge_id", challenge.id)
    .eq("slack_user_id", slackUser.id)
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  if (checkError) {
    throw new Error("Error fetching daily checks");
  }

  if (existingChecks!.length === 0) {
    // Save user command to Supabase if no existing check found
    const { error } = await supabase.from("daily_checks").insert([
      {
        id: makeDailyCheckId(),
        challenge_id: challenge.id,
        slack_user_id: slackUser.id,
      },
    ]);

    if (error) {
      throw new Error("Error creating daily check");
    }
  }

  const start = startOfMonth(date);
  start.setHours(0 + cutoffHour, 0, 0, 0);
  const end = endOfMonth(date);
  end.setHours(0 + cutoffHour, 0, 0, 0);
  const dailyChecks = await getDailyChecks({
    challengeId: challenge.id,
    userId: slackUser.id,
    start,
    end,
  });
  const calendar = await generateCalendar(date, dailyChecks, cutoffHour);
  return calendar;
}

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  const body = request.body;
  console.log("daily-checks::", body);
  const { channel_id, user_id, user_name, channel_name, response_url } = body;

  const slackUser = await getOrCreateSlackUser(user_id, user_name);
  const challenge = await getOrCreateChallenge(channel_id, channel_name);
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

  console.log("daily-checks::res::", res);

  response.status(200).send("Success!");
}
