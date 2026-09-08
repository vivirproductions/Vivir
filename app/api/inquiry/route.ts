import { createTransport } from "nodemailer";

/**
 * Inquiry form endpoint.
 *
 * Mirrors the Gmail SMTP pattern already in use in the Flask portfolio
 * (`/contact` there): SMTP over SSL on port 465, credentials read from
 * GMAIL_USER / GMAIL_APP_PASSWORD, never from a file in the repo.
 *
 * nodemailer opens a raw TLS socket, which the Edge runtime cannot do, so this
 * route is pinned to Node.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The single place the destination address is written. Change it here only. */
export const INQUIRY_TO = "vivir.production@gmail.com";

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465;
/** Matches the 15 s timeout the Flask `/contact` route passes to SMTP_SSL. */
const SMTP_TIMEOUT_MS = 15_000;

const SUBJECT_PREFIX = "[Vivír Inquiry]";
const DEFAULT_SUBJECT = "Website inquiry";
const FROM_NAME = "Vivír Website";

const MAX = {
  name: 120,
  email: 254,
  subject: 160,
  message: 4000,
} as const;

/**
 * Deliberately linear-time: every character class excludes the delimiter that
 * follows it, so no two quantifiers can compete for the same input and there is
 * no backtracking blowup on a long hostile string.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[A-Za-z]{2,}$/;

type Fields = {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot. A real person never sees this input, so it must arrive empty. */
  company: string;
};

type FieldError = { field: string; message: string };

/** Strips CR/LF so a submitted value can never inject an extra mail header. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

function collect(source: Record<string, unknown>): Fields {
  return {
    name: readString(source, "name"),
    email: readString(source, "email"),
    subject: readString(source, "subject"),
    message: readString(source, "message"),
    company: readString(source, "company"),
  };
}

/**
 * Accepts JSON and form encodings alike, so the same endpoint serves the
 * enhanced fetch() submit and a plain `<form method="post">` with JS disabled.
 */
async function readFields(request: Request): Promise<Fields | null> {
  const contentType = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  try {
    if (contentType === "application/json") {
      const parsed: unknown = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }
      return collect(parsed as Record<string, unknown>);
    }

    if (
      contentType === "application/x-www-form-urlencoded" ||
      contentType === "multipart/form-data"
    ) {
      const form = await request.formData();
      const flat: Record<string, unknown> = {};
      for (const [key, value] of form.entries()) {
        if (typeof value === "string" && !(key in flat)) {
          flat[key] = value;
        }
      }
      return collect(flat);
    }
  } catch {
    return null;
  }

  return null;
}

function validate(fields: Fields): FieldError[] {
  const errors: FieldError[] = [];

  if (!fields.name) {
    errors.push({ field: "name", message: "Please tell us your name." });
  } else if (fields.name.length > MAX.name) {
    errors.push({
      field: "name",
      message: `Your name is too long. Please keep it to ${MAX.name} characters or fewer.`,
    });
  }

  if (!fields.email) {
    errors.push({ field: "email", message: "Please give us an email address to reply to." });
  } else if (fields.email.length > MAX.email) {
    errors.push({
      field: "email",
      message: `That email address is too long. Please keep it to ${MAX.email} characters or fewer.`,
    });
  } else if (!EMAIL_SHAPE.test(fields.email)) {
    errors.push({
      field: "email",
      message: "That email address does not look right. Please check it, for example name@example.com.",
    });
  }

  if (fields.subject.length > MAX.subject) {
    errors.push({
      field: "subject",
      message: `Your subject is too long. Please keep it to ${MAX.subject} characters or fewer.`,
    });
  }

  if (!fields.message) {
    errors.push({ field: "message", message: "Please tell us a little about your inquiry." });
  } else if (fields.message.length > MAX.message) {
    errors.push({
      field: "message",
      message: `Your message is too long. Please keep it to ${MAX.message} characters or fewer.`,
    });
  }

  return errors;
}

function buildBody(fields: Fields, subject: string): string {
  return [
    "New inquiry from the Vivír website.",
    "",
    `Name:    ${fields.name}`,
    `Email:   ${fields.email}`,
    `Subject: ${subject}`,
    "",
    "Message:",
    fields.message,
    "",
    "--",
    "Reply to this email and it goes straight back to the sender.",
  ].join("\n");
}

/**
 * True when this is a browser submitting the form natively (no JS): a form
 * encoding plus an Accept header that asks for a page rather than JSON.
 */
function wantsHtml(request: Request, contentType: string): boolean {
  if (contentType === "application/json") return false;
  const accept = (request.headers.get("accept") ?? "").toLowerCase();
  if (accept.includes("application/json")) return false;
  return accept.includes("text/html");
}

/** No user-supplied text is ever interpolated here, so there is nothing to escape. */
function htmlResponse(status: number, heading: string, detail: string): Response {
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${heading} - Vivír</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         background:#03045E; color:#CAF0F8; padding:2rem;
         font:16px/1.6 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
  main { max-width:34rem; text-align:center; }
  h1 { font-size:1.5rem; letter-spacing:.06em; text-transform:uppercase; margin:0 0 .75rem; }
  p { margin:0 0 1.5rem; color:#90E0EF; }
  a { color:#48CAE4; }
</style>
</head>
<body>
<main>
<h1>${heading}</h1>
<p>${detail}</p>
<p><a href="/">Back to Vivír</a></p>
</main>
</body>
</html>`;
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/**
 * Reads only the small, fixed set of scalar fields nodemailer sets on its
 * errors. The credential lives in the transport options and in nothing this
 * function can reach, so a log line built from this cannot carry it.
 */
function describeFailure(error: unknown): { code: string; responseCode: string; name: string } {
  const source = (error ?? {}) as Record<string, unknown>;
  return {
    code: typeof source.code === "string" ? source.code : "UNKNOWN",
    responseCode:
      typeof source.responseCode === "number" ? String(source.responseCode) : "none",
    name: typeof source.name === "string" ? source.name : "Error",
  };
}

export async function POST(request: Request): Promise<Response> {
  const contentType = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const html = wantsHtml(request, contentType);

  const fields = await readFields(request);
  if (!fields) {
    const message =
      "We could not read that submission. Send JSON or a standard form post.";
    return html
      ? htmlResponse(400, "Something went wrong", message)
      : json(400, { ok: false, error: message });
  }

  // Honeypot. Answered before anything else so a bot learns nothing from the
  // shape of the response, and nothing is sent.
  if (fields.company) {
    return html
      ? htmlResponse(200, "Thank you", "Your message is on its way.")
      : json(200, { ok: true });
  }

  const errors = validate(fields);
  if (errors.length > 0) {
    return html
      ? htmlResponse(400, "Check your details", errors[0].message)
      : json(400, {
          ok: false,
          field: errors[0].field,
          error: errors[0].message,
          errors,
        });
  }

  const gmailUser = (process.env.GMAIL_USER ?? "").trim();
  // Google prints app passwords in four spaced groups; the password itself has
  // no spaces, and a pasted-with-spaces value is the usual cause of EAUTH.
  const gmailPassword = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");

  if (!gmailUser || !gmailPassword) {
    console.error(
      "[inquiry] GMAIL_USER and/or GMAIL_APP_PASSWORD are not set; refusing to send.",
    );
    const message =
      "The inquiry mailbox is not configured yet. Please email " +
      INQUIRY_TO +
      " directly.";
    return html
      ? htmlResponse(503, "Not available right now", message)
      : json(503, { ok: false, error: message });
  }

  const subject = oneLine(fields.subject) || DEFAULT_SUBJECT;

  try {
    const transporter = createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: gmailUser, pass: gmailPassword },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });

    await transporter.sendMail({
      // Gmail rejects a From it does not own, and forging the submitter here
      // would be a spoofing pattern. The submitter goes in Reply-To instead.
      from: { name: FROM_NAME, address: gmailUser },
      to: INQUIRY_TO,
      replyTo: { name: oneLine(fields.name), address: fields.email },
      subject: `${SUBJECT_PREFIX} ${subject}`,
      text: buildBody(fields, subject),
    });
  } catch (error: unknown) {
    const detail = describeFailure(error);
    const isAuth = detail.code === "EAUTH" || detail.responseCode === "535";
    console.error(
      `[inquiry] send failed code=${detail.code} responseCode=${detail.responseCode} name=${detail.name}`,
    );
    const message = isAuth
      ? "We could not reach the inquiry mailbox. Please email " + INQUIRY_TO + " directly."
      : "We could not send that just now. Please try again, or email " +
        INQUIRY_TO +
        " directly.";
    return html
      ? htmlResponse(502, "Message not sent", message)
      : json(502, { ok: false, error: message });
  }

  return html
    ? htmlResponse(200, "Thank you", "Your message is on its way. We will reply by email.")
    : json(200, { ok: true });
}
