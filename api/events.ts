import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { endOfMonth, getDate, getDay, startOfMonth } from "date-fns";

export const maxDuration = 30;

const supabaseUrl = "https://opljpbyvufnvjisogaai.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function makeDailyCheckId(): string {
  return `dcheck_${makeId(24)}`;
}

function makeSlackUserId(): string {
  return `slusr_${makeId(24)}`;
}

function makeChallangeId(): string {
  return `chal_${makeId(24)}`;
}

function makeId(length: number): string {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const generateCalendar = async (date: Date, dailyChecks: any[]) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const month = date.getMonth();
  const daysInMonth = end.getDate();
  const startDay = getDay(start);

  const checkDates = dailyChecks.map((check) =>
    getDate(new Date(check.created_at))
  );

  let calendar = [month, "일  월  화  수  목  금  토"];
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

async function isValidSlackRequest(request: VercelRequest, body: any) {
  // const signingSecret = process.env.SLACK_SIGNING_SECRET!;
  // const timestamp = request.headers["x-slack-request-timestamp"];
  // const slackSignature = request.headers["x-slack-signature"];
  // const base = `v0:${timestamp}:${JSON.stringify(body)}`;
  // const hmac = crypto
  //   .createHmac("sha256", signingSecret)
  //   .update(base)
  //   .digest("hex");
  // const computedSignature = `v0=${hmac}`;
  // console.log("Computed Signature", computedSignature, slackSignature);
  // return computedSignature === slackSignature;
  return true;
}

type DailyCheck = {
  id: string;
  challenge_id: string;
  slack_user_id: string;
  created_at: string;
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

async function processCommand({
  slackUser,
  challenge,
  response,
}: {
  slackUser: any;
  challenge: any;
  response: VercelResponse;
}) {
  const date = new Date();

  // Check if a daily check already exists for today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();
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
    const { data, error } = await supabase.from("daily_checks").insert([
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

  const dailyChecks = await getDailyChecks({
    challengeId: challenge.id,
    userId: slackUser.id,
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
  // Generate calendar
  const calendar = await generateCalendar(date, dailyChecks);

  return response
    .status(200)
    .json({ response_type: "in_channel", text: calendar });
}

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  const body = request.body;
  const requestType = body.type;

  if (requestType === "url_verification") {
    return response.status(200).send(body.challenge);
  }

  if (await isValidSlackRequest(request, body)) {
    if (requestType === "event_callback") {
      const eventType = body.event.type;
      if (eventType === "app_mention") {
        return response.status(200).send("Success!");
      }
    }

    if (body.command === "/ㅇㅈ") {
      const { channel_id, user_id, user_name, channel_name, response_url } =
        body;
      const slackUser = await getOrCreateSlackUser(user_id, user_name);
      const challenge = await getOrCreateChallenge(channel_id, channel_name);
      return await processCommand({
        slackUser,
        challenge,
        response,
      });
      // await fetch(response_url, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     response_type: "in_channel",
      //     text: calendar,
      //   }),
      // });
    }
  }

  return response.status(200).send("Success!");
}
