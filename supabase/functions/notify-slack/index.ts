import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  alert_id?: string;
  webhook_url: string;
  endpoint_name?: string;
  alert_type?: string;
  message?: string;
  severity?: string;
  detected_at?: string;
  is_test?: boolean;
}

function formatSlackMessage(payload: NotificationPayload) {
  const baseUrl = "https://ransomradar.example.com";
  const severity = payload.severity?.toUpperCase() || "UNKNOWN";
  const endpointName = payload.endpoint_name || "Unknown Endpoint";
  const alertType = payload.alert_type || "Unknown Alert";
  const message = payload.message || "No details available";
  const detectedAt = payload.detected_at
    ? new Date(payload.detected_at).toLocaleString()
    : new Date().toLocaleString();

  const alertId = payload.alert_id || "test-alert";
  const dashboardLink = `${baseUrl}/alerts/${alertId}`;

  return {
    text: `RansomRadar Alert - ${severity}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🚨 RansomRadar Alert — ${severity}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Endpoint Name*\n${endpointName}`,
          },
          {
            type: "mrkdwn",
            text: `*Alert Type*\n${alertType}`,
          },
          {
            type: "mrkdwn",
            text: `*Severity*\n${severity}`,
          },
          {
            type: "mrkdwn",
            text: `*Time Detected*\n${detectedAt}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Message*\n${message}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View in Dashboard",
              emoji: true,
            },
            value: alertId,
            url: dashboardLink,
            action_id: "view_alert",
          },
        ],
      },
    ],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.webhook_url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing webhook_url parameter",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const slackMessage = formatSlackMessage(payload);

    const slackResponse = await fetch(payload.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackMessage),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      return new Response(
        JSON.stringify({
          success: false,
          error: `Slack API error: ${slackResponse.statusText}`,
          details: errorText,
        }),
        {
          status: slackResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Slack notification sent successfully",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to send notification",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
