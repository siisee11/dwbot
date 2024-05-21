import { VercelRequest, VercelResponse } from "@vercel/node";
import { isValidSlackRequest } from "./_validate-slack";

export const maxDuration = 30;

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  const body = request.body;
  const requestType = body.type;

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
      const eventType = body.event.type;
      if (eventType === "app_mention") {
        return response.status(200).send("Success!");
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
        }),
      });

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return response.status(200).send("Processing...");
    }
  } else {
    return response.status(200).send("유효하지 않은 요청입니다.");
  }

  return response.status(200).send("Success!");
}
