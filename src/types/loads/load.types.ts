import type { GeoLocation } from "@/types/common.types";
import type { Customer } from "@/types/customers/customer.types";
import type { Employee } from "@/types/employees/employee.types";
import type { Truck } from "@/types/trucks/truck.types";
import type { Container } from "@/types/containers/container.types";
import type { Terminal } from "@/types/terminals/terminal.types";
import type { ISODateTime } from "@/types/api.types";
import type {
  LoadResponse,
  LoadConditionReportType,
  LoadExceptionType,
  ConditionDefectSeverity,
  ConditionDefectPartCategory,
} from "./load.dto";

export type Load = LoadResponse;

export interface LoadException {
  id: string;
  loadId: string;
  type: LoadExceptionType;
  reason: string;
  occurredAt: ISODateTime;
  resolvedAt?: ISODateTime | null;
  reportedById: string;
  reportedByName: string;
  resolution?: string | null;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}

export interface ConditionDefect {
  id: string;
  loadConditionReportId: string;
  partCategory: ConditionDefectPartCategory;
  description: string;
  severity: ConditionDefectSeverity;
}

export interface LoadConditionReport {
  id: string;
  loadId: string;
  type: LoadConditionReportType;
  vin?: string | null;
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleBodyClass?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
  notes?: string | null;
  inspectorSignature?: string | null;
  location?: GeoLocation | null;
  inspectedAt: ISODateTime;
  inspectedById: string;
  createdAt: ISODateTime;
  createdBy?: string | null;
  lastModifiedAt?: ISODateTime | null;
  lastModifiedBy?: string | null;
}

export interface LoadWithRelations extends Load {
  customer?: Customer;
  assignedTruck?: Truck | null;
  assignedDispatcher?: Employee | null;
  container?: Container | null;
  originTerminal?: Terminal | null;
  destinationTerminal?: Terminal | null;
  exceptions?: LoadException[];
  conditionReports?: LoadConditionReport[];
}

export interface LoadConditionReportWithRelations extends LoadConditionReport {
  defects?: ConditionDefect[];
  inspectedBy?: Employee;
}
