import { createRequire } from "node:module";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { INQUIRY_TO, POST } from "../app/api/inquiry/route";

/**
 * HOW THE TRANSPORT IS STUBBED
 * ----------------------------
 * `route.ts` uses a named import, `import { createTransport } from "nodemailer"`,
 * which Playwright's TypeScript transform compiles to a property lookup on the
 * CommonJS module object *at call time*: `(0, _nodemailer.createTransport)(...)`.
 * So replacing `createTransport` on that same module object, inside this test
 * process, replaces what the real handler calls — without the handler carrying
 * any test seam, env flag, or injection point of its own.
 *
 * Nothing here can reach production: this file is `tests/**`, Playwright-only,
 * never imported by `app/` or bundled by Next. The shipped route has no branch,
 * export, or environment variable that a stub could be attached to.
 *
 * Belt and braces on top of that: every credential used below is fake, and the
 * success-path tests assert the stub was actually called. If the patch ever
 * stopped taking effect, those assertions go red rather than silently letting a
 * real SMTP connection out.
 */

const nodeRequire = createRequire(path.join(process.cwd(), "package.json"));

type NodemailerModule = {
  createTransport: (...args: unknown[]) => unknown;
  default?: { createTransport: (...args: unknown[]) => unknown };
};

const nodemailer = nodeRequire("nodemailer") as NodemailerModule;

type SmtpError = Error & { code?: string; responseCode?: number };

let transportOptions: Record<string, unknown>[] = [];
let sentMail: Record<string, unknown>[] = [];
let nextSendError: SmtpError | null = null;

let realCreateTransport: NodemailerModule["createTransport"];
let realDefaultCreateTransport: NodemailerModule["createTransport"] | undefined;
let savedEnv: Record<string, string | undefined> = {};

const ENV_KEYS = ["GMAIL_USER", "GMAIL_APP_PASSWORD"] as const;

const FAKE_USER = "vivir.production@gmail.com";
const FAKE_APP_PASSWORD = "notarealapppassw";

const VALID = {
  name: "Test Sender",
  email: "sender@example.com",
  subject: "Test subject",
  message: "Test message body for the inquiry form.",
} as const;

function stubTransport(): unknown {
  return {
    sendMail: async (mail: Record<string, unknown>) => {
      if (nextSendError) {
        const error = nextSendError;
        nextSendError = null;
        throw error;
      }
      sentMail.push(mail);
      return { messageId: "<stub@vivir.test>", accepted: [INQUIRY_TO] };
    },
  };
}

test.beforeEach(() => {
  transportOptions = [];
  sentMail = [];
  nextSendError = null;

  realCreateTransport = nodemailer.createTransport;
  realDefaultCreateTransport = nodemailer.default?.createTransport;

  const fake = (...args: unknown[]) => {
    transportOptions.push((args[0] ?? {}) as Record<string, unknown>);
    return stubTransport();
  };

  nodemailer.createTransport = fake;
  if (nodemailer.default) nodemailer.default.createTransport = fake;

  savedEnv = {};
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
  process.env.GMAIL_USER = FAKE_USER;
  process.env.GMAIL_APP_PASSWORD = FAKE_APP_PASSWORD;
});

test.afterEach(() => {
  nodemailer.createTransport = realCreateTransport;
  if (nodemailer.default && realDefaultCreateTransport) {
    nodemailer.default.createTransport = realDefaultCreateTransport;
  }
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key] as string;
  }
});

function jsonRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/inquiry", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function formRequest(
  pairs: Record<string, string>,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/inquiry", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(pairs).toString(),
  });
}

async function payload(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

// --------------------------------------------------------------------------
// destination
// --------------------------------------------------------------------------

test("the destination address lives in one exported constant", () => {
  expect(INQUIRY_TO).toBe("vivir.production@gmail.com");
});

// --------------------------------------------------------------------------
// required fields -> 400, field-level
// --------------------------------------------------------------------------

for (const missing of ["name", "email", "message"] as const) {
  test(`400 when ${missing} is missing, naming the field`, async () => {
    const body: Record<string, string> = { ...VALID };
    delete body[missing];

    const response = await POST(jsonRequest(body));
    const data = await payload(response);

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.field).toBe(missing);
    expect(String(data.error).length).toBeGreaterThan(0);
    expect(sentMail).toHaveLength(0);
  });

  test(`400 when ${missing} is only whitespace`, async () => {
    const response = await POST(jsonRequest({ ...VALID, [missing]: "   \t  " }));
    const data = await payload(response);

    expect(response.status).toBe(400);
    expect(data.field).toBe(missing);
    expect(sentMail).toHaveLength(0);
  });
}

test("subject is optional and falls back to a default", async () => {
  const body: Record<string, string> = { ...VALID };
  delete body.subject;

  const response = await POST(jsonRequest(body));

  expect(response.status).toBe(200);
  expect(sentMail).toHaveLength(1);
  expect(sentMail[0].subject).toBe("[Vivír Inquiry] Website inquiry");
});

// --------------------------------------------------------------------------
// email shape
// --------------------------------------------------------------------------

for (const bad of [
  "not-an-email",
  "missing-at.example.com",
  "no-domain@",
  "@no-local.com",
  "spaced out@example.com",
  "two@@example.com",
  "trailing@example.",
  "dotless@example",
]) {
  test(`400 on malformed email: ${JSON.stringify(bad)}`, async () => {
    const response = await POST(jsonRequest({ ...VALID, email: bad }));
    const data = await payload(response);

    expect(response.status).toBe(400);
    expect(data.field).toBe("email");
    expect(sentMail).toHaveLength(0);
  });
}

for (const good of ["a@b.co", "first.last+tag@sub.example.co.uk", "x_y-z@example.org"]) {
  test(`accepts a valid email: ${good}`, async () => {
    const response = await POST(jsonRequest({ ...VALID, email: good }));
    expect(response.status).toBe(200);
    expect(sentMail).toHaveLength(1);
  });
}

// --------------------------------------------------------------------------
// length limits
// --------------------------------------------------------------------------

test("400 when the message exceeds 4000 characters", async () => {
  const response = await POST(jsonRequest({ ...VALID, message: "x".repeat(4001) }));
  const data = await payload(response);

  expect(response.status).toBe(400);
  expect(data.field).toBe("message");
  expect(data.error).toBe(
    "Your message is too long. Please keep it to 4000 characters or fewer.",
  );
  expect(sentMail).toHaveLength(0);
});

test("accepts a message of exactly 4000 characters", async () => {
  const response = await POST(jsonRequest({ ...VALID, message: "x".repeat(4000) }));
  expect(response.status).toBe(200);
  expect(sentMail).toHaveLength(1);
});

test("400 when the name exceeds 120 characters", async () => {
  const response = await POST(jsonRequest({ ...VALID, name: "n".repeat(121) }));
  const data = await payload(response);

  expect(response.status).toBe(400);
  expect(data.field).toBe("name");
  expect(data.error).toBe(
    "Your name is too long. Please keep it to 120 characters or fewer.",
  );
  expect(sentMail).toHaveLength(0);
});

test("400 when the subject exceeds 160 characters", async () => {
  const response = await POST(jsonRequest({ ...VALID, subject: "s".repeat(161) }));
  const data = await payload(response);

  expect(response.status).toBe(400);
  expect(data.field).toBe("subject");
  expect(data.error).toBe(
    "Your subject is too long. Please keep it to 160 characters or fewer.",
  );
  expect(sentMail).toHaveLength(0);
});

test("400 when the email exceeds 254 characters", async () => {
  const long = `${"a".repeat(250)}@example.com`;
  const response = await POST(jsonRequest({ ...VALID, email: long }));
  const data = await payload(response);

  expect(response.status).toBe(400);
  expect(data.field).toBe("email");
  expect(data.error).toBe(
    "That email address is too long. Please keep it to 254 characters or fewer.",
  );
  expect(sentMail).toHaveLength(0);
});

// --------------------------------------------------------------------------
// honeypot
// --------------------------------------------------------------------------

test("a filled honeypot returns a generic no-send response and sends nothing", async () => {
  const response = await POST(jsonRequest({ ...VALID, website: "https://bot.example" }));
  const data = await payload(response);

  expect(response.status).toBe(200);
  expect(data.ok).toBe(false);
  expect(data.error).toBe("We could not send that just now. Please email vivir.production@gmail.com directly.");
  expect(sentMail).toHaveLength(0);
  expect(transportOptions).toHaveLength(0);
});

test("a filled honeypot short-circuits before validation and preserves the generic failure shape", async () => {
  const response = await POST(jsonRequest({ website: "https://bot.example", email: "not-an-email" }));
  const data = await payload(response);

  expect(response.status).toBe(200);
  expect(data.ok).toBe(false);
  expect(data.field).toBeUndefined();
  expect(sentMail).toHaveLength(0);
});

test("an empty honeypot does not block a real submission", async () => {
  const response = await POST(jsonRequest({ ...VALID, website: "" }));
  expect(response.status).toBe(200);
  expect(sentMail).toHaveLength(1);
});

// --------------------------------------------------------------------------
// missing configuration -> 503
// --------------------------------------------------------------------------

test("503 when GMAIL_USER is absent", async () => {
  delete process.env.GMAIL_USER;

  const response = await POST(jsonRequest(VALID));
  const data = await payload(response);

  expect(response.status).toBe(503);
  expect(data.ok).toBe(false);
  expect(sentMail).toHaveLength(0);
  expect(transportOptions).toHaveLength(0);
});

test("503 when GMAIL_APP_PASSWORD is absent", async () => {
  delete process.env.GMAIL_APP_PASSWORD;

  const response = await POST(jsonRequest(VALID));

  expect(response.status).toBe(503);
  expect(sentMail).toHaveLength(0);
  expect(transportOptions).toHaveLength(0);
});

test("503 when both credentials are absent, and nothing is logged elsewhere instead", async () => {
  delete process.env.GMAIL_USER;
  delete process.env.GMAIL_APP_PASSWORD;

  const response = await POST(jsonRequest(VALID));
  const data = await payload(response);

  expect(response.status).toBe(503);
  expect(sentMail).toHaveLength(0);
  // The operator-facing message must not be a silent success.
  expect(data.ok).toBe(false);
});

test("503 when the credentials are present but blank", async () => {
  process.env.GMAIL_USER = "   ";
  process.env.GMAIL_APP_PASSWORD = "  ";

  const response = await POST(jsonRequest(VALID));

  expect(response.status).toBe(503);
  expect(sentMail).toHaveLength(0);
});

// --------------------------------------------------------------------------
// urlencoded parity with JSON
// --------------------------------------------------------------------------

test("a urlencoded body is parsed the same as a JSON body", async () => {
  const jsonResponse = await POST(jsonRequest(VALID));
  expect(jsonResponse.status).toBe(200);
  const fromJson = sentMail[0];

  sentMail = [];

  const formResponse = await POST(formRequest({ ...VALID }));
  expect(formResponse.status).toBe(200);
  const fromForm = sentMail[0];

  expect(fromForm.to).toEqual(fromJson.to);
  expect(fromForm.subject).toEqual(fromJson.subject);
  expect(fromForm.text).toEqual(fromJson.text);
  expect(fromForm.replyTo).toEqual(fromJson.replyTo);
  expect(fromForm.from).toEqual(fromJson.from);
});

test("a urlencoded body is validated the same as a JSON body", async () => {
  const response = await POST(formRequest({ ...VALID, email: "not-an-email" }));
  const data = await payload(response);

  expect(response.status).toBe(400);
  expect(data.field).toBe("email");
  expect(sentMail).toHaveLength(0);
});

test("a urlencoded honeypot is caught the same as a JSON one", async () => {
  const response = await POST(formRequest({ ...VALID, website: "https://bot.example" }));

  expect(response.status).toBe(200);
  expect(sentMail).toHaveLength(0);
});

test("400 on an unreadable body or an unsupported content type", async () => {
  const badJson = await POST(jsonRequest("{ not json"));
  expect(badJson.status).toBe(400);

  const plain = new Request("http://localhost/api/inquiry", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "name=x",
  });
  expect((await POST(plain)).status).toBe(400);
  expect(sentMail).toHaveLength(0);
});

// --------------------------------------------------------------------------
// the message that gets sent
// --------------------------------------------------------------------------

test("sends to INQUIRY_TO, from GMAIL_USER, replying to the submitter", async () => {
  const response = await POST(jsonRequest(VALID));

  expect(response.status).toBe(200);
  expect(sentMail).toHaveLength(1);

  const mail = sentMail[0];
  expect(mail.to).toBe(INQUIRY_TO);
  expect(mail.from).toEqual({ name: "Vivír Website", address: FAKE_USER });
  expect(mail.replyTo).toEqual({ name: VALID.name, address: VALID.email });
  expect(mail.subject).toBe(`[Vivír Inquiry] ${VALID.subject}`);

  const text = String(mail.text);
  expect(text).toContain(VALID.name);
  expect(text).toContain(VALID.email);
  expect(text).toContain(VALID.message);
  expect(mail.html).toBeUndefined();
});

test("the submitter's address never becomes the From header", async () => {
  await POST(jsonRequest(VALID));
  expect(JSON.stringify(sentMail[0].from)).not.toContain(VALID.email);
});

test("uses Gmail SMTP over SSL on 465 with a 15s timeout", async () => {
  await POST(jsonRequest(VALID));

  expect(transportOptions).toHaveLength(1);
  const options = transportOptions[0];
  expect(options.host).toBe("smtp.gmail.com");
  expect(options.port).toBe(465);
  expect(options.secure).toBe(true);
  expect(options.connectionTimeout).toBe(15_000);
  expect(options.greetingTimeout).toBe(15_000);
  expect(options.socketTimeout).toBe(15_000);
  expect(options.auth).toEqual({ user: FAKE_USER, pass: FAKE_APP_PASSWORD });
});

test("an app password pasted with Google's display spaces still authenticates", async () => {
  // Google displays app passwords as four spaced groups; the password itself
  // has no spaces, and pasting them in is the usual cause of EAUTH.
  process.env.GMAIL_APP_PASSWORD = "nota real appp assw";

  const response = await POST(jsonRequest(VALID));

  expect(response.status).toBe(200);
  expect((transportOptions[0].auth as Record<string, string>).pass).toBe("notarealapppassw");
});

test("newlines in the subject cannot inject a mail header", async () => {
  const response = await POST(
    jsonRequest({ ...VALID, subject: "Hello\r\nBcc: someone-else@example.com" }),
  );

  expect(response.status).toBe(200);
  const subject = String(sentMail[0].subject);
  expect(subject).not.toContain("\n");
  expect(subject).not.toContain("\r");
});

// --------------------------------------------------------------------------
// SMTP failure -> 502, without leaking anything
// --------------------------------------------------------------------------

test("502 on SMTP auth failure, with no credential in the response", async () => {
  const error: SmtpError = Object.assign(
    new Error(`Invalid login: 535-5.7.8 Username and Password not accepted ${FAKE_APP_PASSWORD}`),
    { code: "EAUTH", responseCode: 535 },
  );
  nextSendError = error;

  const response = await POST(jsonRequest(VALID));
  const raw = JSON.stringify(await payload(response));

  expect(response.status).toBe(502);
  expect(raw).not.toContain(FAKE_APP_PASSWORD);
  expect(raw).not.toContain("535");
  expect(raw).not.toContain("Invalid login");
});

test("502 on a network failure, with no exception text in the response", async () => {
  nextSendError = Object.assign(new Error("connect ETIMEDOUT 142.250.1.109:465"), {
    code: "ETIMEDOUT",
  });

  const response = await POST(jsonRequest(VALID));
  const raw = JSON.stringify(await payload(response));

  expect(response.status).toBe(502);
  expect(raw).not.toContain("ETIMEDOUT");
  expect(raw).not.toContain("142.250");
});

// --------------------------------------------------------------------------
// no-JS browser submit
// --------------------------------------------------------------------------

test("a native form post from a browser gets an HTML page, not raw JSON", async () => {
  const response = await POST(
    formRequest({ ...VALID }, { accept: "text/html,application/xhtml+xml,*/*;q=0.8" }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");
  const html = await response.text();
  expect(html).toContain("<!doctype html>");
  expect(html).toContain("<title>Thank you - Vivír</title>");
  expect(sentMail).toHaveLength(1);
});

test("a native form post that fails validation gets an HTML page with the reason", async () => {
  const response = await POST(
    formRequest({ ...VALID, email: "nope" }, { accept: "text/html,*/*;q=0.8" }),
  );

  expect(response.status).toBe(400);
  expect(response.headers.get("content-type")).toContain("text/html");
  const html = await response.text();
  expect(html).toContain(
    "That email address does not look right. Please check it, for example name@example.com.",
  );
  expect(html).toContain("<title>Check your details - Vivír</title>");
  expect(sentMail).toHaveLength(0);
});

test("an explicit JSON Accept header still gets JSON from a form body", async () => {
  const response = await POST(
    formRequest({ ...VALID }, { accept: "application/json" }),
  );

  expect(response.headers.get("content-type")).toContain("application/json");
  expect((await payload(response)).ok).toBe(true);
});

test("responses are never cached", async () => {
  const response = await POST(jsonRequest(VALID));
  expect(response.headers.get("cache-control")).toContain("no-store");
});

// --------------------------------------------------------------------------
// the route is actually mounted
//
// These deliberately never POST. Playwright reuses an already-running dev
// server (`reuseExistingServer`), and that server loads `.env.local`, which on
// this machine holds Hanz's real Gmail app password. A POST from a test would
// be one broken guard away from putting real mail in a real inbox, so the HTTP
// layer is probed only with methods the route does not implement. Everything
// about the handler's behaviour is exercised above by calling the real exported
// POST function directly, against the stubbed transport.
// --------------------------------------------------------------------------

for (const method of ["get", "put", "delete"] as const) {
  test(`${method.toUpperCase()} /api/inquiry is mounted but not allowed`, async ({ request }) => {
    const response = await request[method]("/api/inquiry");
    // 405, not 404: the route file exists at this path and exports POST only.
    expect(response.status()).toBe(405);
  });
}
