export interface Env {
  NEWTTRACE_KV: KVNamespace;
  DISCORD_CLIENT_ID: string;
  DISCORD_REDIRECT_URI: string;
}

interface InstallSession {
  source: string;
  campaign?: string;
  createdAt: number;
}

const COOKIE_NAME = "newttrace_install";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/install") {
      return handleInstall(request, env, url);
    }

    if (url.pathname === "/callback") {
      return handleCallback(env, url);
    }

    if (url.pathname === "/resolve") {
      return handleResolve(env, url);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleInstall(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const source = url.searchParams.get("source") ?? "unknown";
  const campaign = url.searchParams.get("campaign") ?? undefined;
  const permissions = url.searchParams.get("permissions") ?? "0";
  const scopes = url.searchParams.get("scopes")?.split(",") ?? ["bot"];

  const installId = crypto.randomUUID();
  const session: InstallSession = {
    source,
    campaign,
    createdAt: Date.now(),
  };

  // Store with 10-minute TTL
  await env.NEWTTRACE_KV.put(
    `install:${installId}`,
    JSON.stringify(session),
    { expirationTtl: 600 }
  );

  const discordUrl = new URL("https://discord.com/oauth2/authorize");
  discordUrl.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
  discordUrl.searchParams.set("scope", scopes.join(" "));
  discordUrl.searchParams.set("permissions", permissions);
  discordUrl.searchParams.set("state", installId);
  discordUrl.searchParams.set("redirect_uri", env.DISCORD_REDIRECT_URI);
  discordUrl.searchParams.set("response_type", "code");

  return Response.redirect(discordUrl.toString(), 302);
}

async function handleCallback(env: Env, url: URL): Promise<Response> {
  const state = url.searchParams.get("state");
  const guildId = url.searchParams.get("guild_id");

  if (!state) {
    return new Response("Missing state", { status: 400 });
  }

  const sessionJson = await env.NEWTTRACE_KV.get(`install:${state}`);
  if (!sessionJson) {
    return new Response("Install session expired or invalid", { status: 400 });
  }

  const session: InstallSession = JSON.parse(sessionJson);

  // Store guild attribution with 24h TTL (bot should pick it up quickly)
  if (guildId) {
    await env.NEWTTRACE_KV.put(
      `guild:${guildId}`,
      JSON.stringify({
        source: session.source,
        campaign: session.campaign,
        installId: state,
      }),
      { expirationTtl: 86400 }
    );
  }

  // Redirect to success page or bot's landing page
  return Response.redirect("https://discord.com/oauth2/authorized", 302);
}

async function handleResolve(env: Env, url: URL): Promise<Response> {
  const guildId = url.searchParams.get("guild_id");
  if (!guildId) {
    return new Response('{"source":null}', {
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await env.NEWTTRACE_KV.get(`guild:${guildId}`);
  if (!data) {
    return new Response('{"source":null}', {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(data, {
    headers: { "Content-Type": "application/json" },
  });
}
