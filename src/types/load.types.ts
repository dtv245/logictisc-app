import type { Address, GeoLocation, Money } from "./common.types";
import type { Customer } from "./customer.types";
import type { Employee } from "./employee.types";
import type { Truck } from "./truck.types";
import type { Container } from "./container.types";
import type { Terminal } from "./terminal.types";
import type {
  LoadType,
  LoadStatus,
  LoadSource,
  ExternalLoadProviderType,
  HazmatClass,
  LoadConditionReportType,
  LoadExceptionType,
  ConditionDefectSeverity,
  ConditionDefectPartCategory,
} from "./load.dto";

export interface Load {
  id: string;
  number: number;
  name: string;
  type: LoadType;
  status: LoadStatus;
  distance: number;
  isInProximity: boolean;
  dispatchedAt?: Date | null;
  pickedUpAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
  customerId: string;
  customerName?: string;
  assignedTruckId?: string | null;
  assignedTruckNumber?: string | null;
  assignedDispatcherId?: string | null;
  assignedDispatcherName?: string | null;
  source: LoadSource;
  requestedPickupDate?: Date | null;
  requestedDeliveryDate?: Date | null;
  notes?: string | null;
  isHazmat: boolean;
  hazmatClass?: HazmatClass | null;
  unNumber?: string | null;
  containerId?: string | null;
  originTerminalId?: string | null;
  destinationTerminalId?: string | null;
  externalSourceProvider?: ExternalLoadProviderType | null;
  externalSourceId?: string | null;
  externalBrokerReference?: string | null;
  deliveryCost: Money;
  destinationAddress: Address;
  destinationLocation: GeoLocation;
  originAddress: Address;
  originLocation: GeoLocation;
  createdAt: Date;
  createdBy?: string | null;
  lastModifiedAt?: Date | null;
  lastModifiedBy?: string | null;
}

export interface LoadException {
  id: string;
  loadId: string;
  type: LoadExceptionType;
  reason: string;
  occurredAt: Date;
  resolvedAt?: Date | null;
  reportedById: string;
  reportedByName: string;
  resolution?: string | null;
  createdAt: Date;
  createdBy?: string | null;
  lastModifiedAt?: Date | null;
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
  inspectedAt: Date;
  inspectedById: string;
  createdAt: Date;
  createdBy?: string | null;
  lastModifiedAt?: Date | null;
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
