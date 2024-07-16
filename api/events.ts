import { VercelRequest, VercelResponse } from "@vercel/node";
import { isValidSlackRequest } from "./_validate-slack";
import packageJson from "../package.json"; // Import the package.json file
import { DailyCheckRequest } from "./commands/daily-checks";

export const maxDuration = 30;

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  const body = request.body;
  console.log("events::", body);
  const requestType = body.type;
  const version = packageJson.version;
  console.log("version::", version);

  if (requestType === "url_verification") {
    return response.status(200).send(body.challenge);
  }

  const signingSecret = process.env.SLACK_SIGNING_SECRET!;
  const timestamp = parseInt(
    request.headers["x-slack-request-timestamp"] as string
  );
  const slackSignature = request.headers["x-slack-signature"] as string;
  const rawBody = JSON.stringify(body);
  if (
    isValidSlackRequest({
      signingSecret,
      body: rawBody,
      headers: {
        "x-slack-signature": slackSignature,
        "x-slack-request-timestamp": timestamp,
      },
    })
  ) {
    if (requestType === "event_callback") {
      const event = body.event;
      const eventType = event.type;

      if (eventType === "message" && event.subtype !== "bot_message") {
        // If the message contains an image, add a heart reaction
        if (event.files && event.files.length > 0) {
          const hasImage = event.files.some((file: any) =>
            file.mimetype.startsWith("image/")
          );
          if (hasImage) {
            const slackToken = process.env.SLACK_BOT_TOKEN!;
            await fetch("https://slack.com/api/reactions.add", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${slackToken}`,
              },
              body: JSON.stringify({
                name: "heart",
                channel: event.channel,
                timestamp: event.ts,
              }),
            });
          }
        }
        return response.status(200);
      }
    }

    if (body.command === "/ㅇㅈ") {
      const { channel_id, user_id, user_name, channel_name, response_url } =
        body;

      // Below endpoint will handle daily checks
      fetch(`${process.env.SERVER_BASE_URL!}/api/commands/daily-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id,
          user_id,
          user_name,
          channel_name,
          response_url,
          checkType: "checkin",
        } as DailyCheckRequest),
      });

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return response.status(200).send("ㅇㅈ봇이 달력을 보고있어요...");
    } else if (body.command === "/ㅎㄱ") {
      const { channel_id, user_id, user_name, channel_name, response_url } =
        body;

      // Below endpoint will handle daily checks
      fetch(`${process.env.SERVER_BASE_URL!}/api/commands/daily-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id,
          user_id,
          user_name,
          channel_name,
          response_url,
          checkType: "vacation",
        } as DailyCheckRequest),
      });

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return response.status(200).send("ㅇㅈ봇이 달력을 보고있어요...");
    } else if (body.command === "/ㄱㅈ") {
      const { text, user_id } = body;
      if (user_id !== process.env.SLACK_ADMIN_MEMBER_ID) {
        return response.status(200).send("관리자만 사용할 수 있어요.");
      }

      const generalChannelId = process.env.SLACK_ANNOUNCEMENT_CHANNEL_ID;
      const slackToken = process.env.SLACK_BOT_TOKEN!;

      await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${slackToken}`,
        },
        body: JSON.stringify({
          channel: generalChannelId,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `v${version} 업데이트`,
              },
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: text,
              },
            },
          ],
        }),
      });

      return response.status(200).send("공지가 전송되었어요.");
    }
  } else {
    return response.status(200).send("오류입니다. 제이를 태그해주세요.");
  }

  return response.status(200).send("이상한 커맨드를 입력하셨나요?");
}
