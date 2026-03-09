/**
 * Snowflake REST API client — no external SDK needed.
 * Uses the session-based login + SQL execution endpoints.
 */

const SNOWFLAKE_ACCOUNT = process.env.SNOWFLAKE_ACCOUNT!; // e.g. UNBOKAE-OB87913
const SNOWFLAKE_USERNAME = process.env.SNOWFLAKE_USERNAME!;
const SNOWFLAKE_PASSWORD = process.env.SNOWFLAKE_PASSWORD!;
const SNOWFLAKE_WAREHOUSE = process.env.SNOWFLAKE_WAREHOUSE || "COMPUTE_WH";
const SNOWFLAKE_DATABASE = process.env.SNOWFLAKE_DATABASE || "NEOTASTE_PROD";
const SNOWFLAKE_SCHEMA = process.env.SNOWFLAKE_SCHEMA || "SUBSCRIPTION";

function getBaseUrl() {
  // Snowflake account identifiers with a hyphen use the format: orgname-accountname
  return `https://${SNOWFLAKE_ACCOUNT}.snowflakecomputing.com`;
}

/** Login and get a session token */
async function getSessionToken(): Promise<string> {
  const url = `${getBaseUrl()}/session/v1/login-request`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      data: {
        ACCOUNT_NAME: SNOWFLAKE_ACCOUNT,
        LOGIN_NAME: SNOWFLAKE_USERNAME,
        PASSWORD: SNOWFLAKE_PASSWORD,
        CLIENT_APP_ID: "neotaste-partner-portal",
        CLIENT_APP_VERSION: "1.0.0",
      },
    }),
  });

  const json = await res.json();

  if (!json.success) {
    console.error("Snowflake login failed:", json.message);
    throw new Error(`Snowflake login failed: ${json.message}`);
  }

  return json.data.token;
}

/** Execute a SQL query and return rows */
export async function querySnowflake<T = Record<string, unknown>>(
  sql: string,
  bindings?: Record<string, { type: string; value: string }>
): Promise<T[]> {
  const token = await getSessionToken();

  const url = `${getBaseUrl()}/queries/v1/query-request`;

  const body: Record<string, unknown> = {
    sqlText: sql,
    sequenceId: 0,
    bindings: bindings || {},
    parameters: {
      WAREHOUSE: SNOWFLAKE_WAREHOUSE,
      DATABASE: SNOWFLAKE_DATABASE,
      SCHEMA: SNOWFLAKE_SCHEMA,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Snowflake Token="${token}"`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!json.success) {
    console.error("Snowflake query failed:", json.message);
    throw new Error(`Snowflake query failed: ${json.message}`);
  }

  // Map column names to row values
  const columns: string[] = json.data.rowtype.map(
    (col: { name: string }) => col.name
  );
  const rows: T[] = (json.data.rowset as unknown[][]).map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });

  return rows;
}

export interface DashboardStats {
  codesRedeemed: number;
  annualSubscribers: number;
  monthlySubscribers: number;
  totalEarnings: number;
  monthlyReferrals: { month: string; count: number }[];
}

/** Fetch all dashboard stats for a given voucher code */
export async function getDashboardStats(
  voucherCode: string
): Promise<DashboardStats> {
  const safeCode = voucherCode.replace(/'/g, "''");

  // 1. Total codes redeemed (distinct subscriptions that used this code)
  const codeResult = await querySnowflake<{ CODES_REDEEMED: string }>(
    `SELECT COUNT(DISTINCT SUBSCRIPTIONID) AS CODES_REDEEMED
     FROM NEOTASTE_PROD.SUBSCRIPTION.SUBSCRIPTION_EVENTS
     WHERE LOWER(DISCOUNTCODEUSED) = LOWER('${safeCode}')
       AND TYPE = 'Referral'`
  );
  const codesRedeemed = parseInt(codeResult[0]?.CODES_REDEEMED || "0", 10);

  // 2. Conversions — breakdown by annual vs monthly subscription type
  const conversionResult = await querySnowflake<{
    SUBSCRIPTIONTYPE: string;
    CNT: string;
  }>(
    `SELECT COALESCE(SUBSCRIPTIONTYPE, 'Unknown') AS SUBSCRIPTIONTYPE,
            COUNT(DISTINCT SUBSCRIPTIONID) AS CNT
     FROM NEOTASTE_PROD.SUBSCRIPTION.SUBSCRIPTION_EVENTS
     WHERE LOWER(DISCOUNTCODEUSED) = LOWER('${safeCode}')
       AND TYPE = 'Referral'
     GROUP BY SUBSCRIPTIONTYPE`
  );

  let annualSubscribers = 0;
  let monthlySubscribers = 0;
  for (const row of conversionResult) {
    const type = (row.SUBSCRIPTIONTYPE || "").toLowerCase();
    const count = parseInt(row.CNT || "0", 10);
    if (type === "yearly" || type === "annual") {
      annualSubscribers += count;
    } else if (type === "monthly") {
      monthlySubscribers += count;
    }
  }

  // 3. Total earnings = codes redeemed × £20 commission per subscription
  const totalEarnings = codesRedeemed * 20;

  // 4. Monthly referrals for the bar chart (last 6 months)
  const monthlyResult = await querySnowflake<{
    MONTH_LABEL: string;
    REF_COUNT: string;
  }>(
    `SELECT TO_CHAR(CREATED, 'Mon') AS MONTH_LABEL,
            COUNT(DISTINCT SUBSCRIPTIONID) AS REF_COUNT
     FROM NEOTASTE_PROD.SUBSCRIPTION.SUBSCRIPTION_EVENTS
     WHERE LOWER(DISCOUNTCODEUSED) = LOWER('${safeCode}')
       AND TYPE = 'Referral'
       AND CREATED >= DATEADD('month', -6, CURRENT_DATE())
     GROUP BY DATE_TRUNC('month', CREATED), TO_CHAR(CREATED, 'Mon')
     ORDER BY DATE_TRUNC('month', CREATED)`
  );

  const monthlyReferrals = monthlyResult.map((r) => ({
    month: r.MONTH_LABEL,
    count: parseInt(r.REF_COUNT || "0", 10),
  }));

  return {
    codesRedeemed,
    annualSubscribers,
    monthlySubscribers,
    totalEarnings,
    monthlyReferrals,
  };
}
