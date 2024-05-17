import crypto from "crypto";
import { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  maxDuration: 30,
};

async function isValidSlackRequest(request: VercelRequest, body: any) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET!;
  const timestamp = request.headers["X-Slack-Request-Timestamp"];
  const slackSignature = request.headers["X-Slack-Signature"];
  const base = `v0:${timestamp}:${JSON.stringify(body)}`;
  const hmac = crypto
    .createHmac("sha256", signingSecret)
    .update(base)
    .digest("hex");
  const computedSignature = `v0=${hmac}`;
  return computedSignature === slackSignature;
}

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  console.log("Received request", request.body, request.headers);
  const body = request.body;
  const requestType = body.type;

  if (requestType === "url_verification") {
    return response.status(200).send(body.challenge);
  }

  if (await isValidSlackRequest(request, body)) {
    if (requestType === "event_callback") {
      const eventType = body.event.type;
      if (eventType === "app_mention") {
        console.log("Received app mention", body);
        return response.status(200).send("Success!");
      }
    }
  }

  return response.status(200).send("Success!");
}
