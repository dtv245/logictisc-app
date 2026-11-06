/** Kiểu dữ liệu xe, giữ nguyên tên trường từ TruckView API. */
export interface Vehicle {
  id: string;
  version: number;
  number: string;
  type: string;
  vehicleCapacity: number;
  status: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  licensePlate: string | null;
  licensePlateState: string | null;
  isHazmatPlacarded: boolean;
  mainDriverId: string | null;
  mainDriverName: string | null;
  secondaryDriverId: string | null;
  secondaryDriverName: string | null;
  adrEquipmentIsAdrCertified: boolean;
  adrEquipmentAllowedClasses: string;
  currentLocationLatitude: number | null;
  currentLocationLongitude: number | null;
}

/** Payload phân trang danh sách xe do API trả về. */
export interface VehiclePage {
  items: Vehicle[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface VehicleStatusMeta {
  label: string;
  tagColor: string;
  dotColor: string;
}
