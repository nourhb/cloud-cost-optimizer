import Papa from "papaparse";
import {
  BILLING_CSV_COLUMNS,
  billingCsvRowSchema,
  type BillingCsvColumn,
} from "@/schemas/billing-csv";
import type { ImportRejection, ParsedBillingRow } from "@/types/domain";

export type ParseCsvOptions = {
  maxBytes: number;
  maxRows: number;
};

export type ParseCsvResult = {
  accepted: ParsedBillingRow[];
  rejected: ImportRejection[];
  missingColumns: BillingCsvColumn[];
  totalRows: number;
};

function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

export function parseBillingCsv(
  content: string,
  options: ParseCsvOptions,
): ParseCsvResult {
  const byteLength = Buffer.byteLength(content, "utf8");
  if (byteLength > options.maxBytes) {
    throw new CsvLimitError(
      `File exceeds the ${formatBytes(options.maxBytes)} size limit (${formatBytes(byteLength)}).`,
    );
  }

  const parsed = Papa.parse<Record<string, unknown>>(content, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    const fatal = parsed.errors.find((error) => error.type === "Delimiter");
    if (fatal) {
      throw new CsvParseError(
        fatal.message || "Could not parse CSV delimiters.",
      );
    }
  }

  const fields = (parsed.meta.fields ?? []).map((field) =>
    field.trim().toLowerCase(),
  );
  const missingColumns = BILLING_CSV_COLUMNS.filter(
    (column) => !fields.includes(column),
  );

  if (missingColumns.length > 0) {
    return {
      accepted: [],
      rejected: [],
      missingColumns,
      totalRows: 0,
    };
  }

  if (parsed.data.length > options.maxRows) {
    throw new CsvLimitError(
      `File exceeds the ${options.maxRows.toLocaleString("en")} row limit (${parsed.data.length.toLocaleString("en")} rows).`,
    );
  }

  const accepted: ParsedBillingRow[] = [];
  const rejected: ImportRejection[] = [];

  parsed.data.forEach((raw, index) => {
    const rowNumber = index + 2; // header is row 1
    const candidate = {
      billing_date: cellToString(raw.billing_date),
      provider: cellToString(raw.provider),
      service: cellToString(raw.service),
      region: cellToString(raw.region),
      resource_id: cellToString(raw.resource_id),
      usage_quantity: cellToString(raw.usage_quantity),
      usage_unit: cellToString(raw.usage_unit),
      cost: cellToString(raw.cost),
      currency: cellToString(raw.currency),
      environment: cellToString(raw.environment),
    };

    const result = billingCsvRowSchema.safeParse(candidate);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => {
          const field = issue.path.join(".") || "row";
          return `${field}: ${issue.message}`;
        })
        .join("; ");
      rejected.push({ rowNumber, message });
      return;
    }

    const row = result.data;
    accepted.push({
      billingDate: row.billing_date,
      provider: row.provider,
      service: row.service,
      region: row.region,
      resourceId: row.resource_id,
      usageQuantity: row.usage_quantity,
      usageUnit: row.usage_unit,
      cost: row.cost,
      currency: row.currency,
      environment: row.environment,
    });
  });

  return {
    accepted,
    rejected,
    missingColumns: [],
    totalRows: parsed.data.length,
  };
}

export class CsvLimitError extends Error {
  readonly code = "CSV_LIMIT" as const;
  constructor(message: string) {
    super(message);
    this.name = "CsvLimitError";
  }
}

export class CsvParseError extends Error {
  readonly code = "CSV_PARSE" as const;
  constructor(message: string) {
    super(message);
    this.name = "CsvParseError";
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
