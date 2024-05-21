import crypto from "crypto";
import { VercelRequest, VercelResponse } from "@vercel/node";

export const maxDuration = 30;

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
  }

  return response.status(200).send("Success!");
}
