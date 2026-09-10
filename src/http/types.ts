import type { EndToEndProgressionRequest } from "../api/types";
import type { QueryBuildMetricsRequest } from "../api/query-build-metrics";

export type HttpProgressionRequest = Omit<
  EndToEndProgressionRequest,
  "candidateDominance" | "evaluateStructuralMajor"
>;

export type HttpMetricsRequest = QueryBuildMetricsRequest;

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export interface HttpErrorBody {
  error: {
    code:
      | "INVALID_JSON"
      | "PAYLOAD_TOO_LARGE"
      | "UNSUPPORTED_MEDIA_TYPE"
      | "VALIDATION_ERROR"
      | "ENGINE_VALIDATION_ERROR"
      | "NOT_FOUND"
      | "INTERNAL_ERROR";
    message: string;
    issues?: readonly ValidationIssue[];
  };
}

export interface HttpSuccessBody<T> {
  data: T;
}
