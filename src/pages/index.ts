/**
 * Tập trung Refine resource registry và route-component mapping.
 */

import { DashboardOutlined } from "@ant-design/icons";
import type { IResourceItem } from "@refinedev/core";
import { createElement, type ComponentType } from "react";

import { routes } from "../constants/routes";
import {
  AccidentCreate,
  AccidentEdit,
  AccidentList,
  accidentsResource,
  AccidentShow,
} from "./accidents";
import {
  AiDispatchCreate,
  AiDispatchEdit,
  AiDispatchList,
  aiDispatchResource,
  AiDispatchShow,
} from "./ai-dispatch";
import {
  ContainerCreate,
  ContainerEdit,
  ContainerList,
  containersResource,
  ContainerShow,
} from "./containers";
import {
  ConversationCreate,
  ConversationEdit,
  ConversationList,
  conversationsResource,
  ConversationShow,
} from "./conversations";
import {
  CustomerCreate,
  CustomerEdit,
  CustomerList,
  customersResource,
  CustomerShow,
} from "./customers";
import {
  DocumentCreate,
  DocumentEdit,
  DocumentList,
  documentsResource,
  DocumentShow,
} from "./documents";
import {
  DvirCreate,
  DvirEdit,
  DvirList,
  dvirResource,
  DvirShow,
} from "./dvir";
import {
  EmployeeCreate,
  EmployeeEdit,
  EmployeeList,
  employeesResource,
  EmployeeShow,
} from "./employees";
import {
  ExpenseCreate,
  ExpenseEdit,
  ExpenseList,
  expensesResource,
  ExpenseShow,
} from "./expenses";
import {
  HosEldCreate,
  HosEldEdit,
  HosEldList,
  hosEldResource,
  HosEldShow,
} from "./hos-eld";
import {
  InvoiceCreate,
  InvoiceEdit,
  InvoiceList,
  invoicesResource,
  InvoiceShow,
} from "./invoices";
import {
  LoadBoardCreate,
  LoadBoardEdit,
  LoadBoardList,
  loadBoardResource,
  LoadBoardShow,
} from "./load-board";
import {
  LoadCreate,
  LoadEdit,
  LoadList,
  loadsResource,
  LoadShow,
} from "./loads";
import {
  MaintenanceCreate,
  MaintenanceEdit,
  MaintenanceList,
  maintenanceResource,
  MaintenanceShow,
} from "./maintenance";
import {
  NotificationCreate,
  NotificationEdit,
  NotificationList,
  notificationsResource,
  NotificationShow,
} from "./notifications";
import {
  PaymentCreate,
  PaymentEdit,
  PaymentList,
  paymentsResource,
  PaymentShow,
} from "./payments";
import {
  ProductCreate,
  ProductEdit,
  ProductList,
  productsResource,
  ProductShow,
} from "./products";
import {
  TerminalCreate,
  TerminalEdit,
  TerminalList,
  terminalsResource,
  TerminalShow,
} from "./terminals";
import {
  TripCreate,
  TripEdit,
  TripList,
  tripsResource,
  TripShow,
} from "./trips";
import {
  TruckCreate,
  TruckEdit,
  TruckList,
  trucksResource,
  TruckShow,
} from "./trucks";

interface CrudPageRoutes {
  create: string;
  edit: string;
  list: string;
  show: string;
}

interface CrudPageComponents {
  Create: ComponentType;
  Edit: ComponentType;
  List: ComponentType;
  Show: ComponentType;
}

export interface ResourcePageRoute {
  component: ComponentType;
  path: string;
}

const createResourcePageRoutes = (
  resourceRoutes: CrudPageRoutes,
  components: CrudPageComponents,
): ResourcePageRoute[] => [
  { component: components.List, path: resourceRoutes.list },
  { component: components.Create, path: resourceRoutes.create },
  { component: components.Edit, path: resourceRoutes.edit },
  { component: components.Show, path: resourceRoutes.show },
];

const dashboardResource: IResourceItem = {
  name: "dashboard",
  list: routes.dashboard,
  meta: {
    icon: createElement(DashboardOutlined),
    label: "Tổng quan",
  },
};

export const appResources: IResourceItem[] = [
  dashboardResource,
  loadsResource,
  trucksResource,
  tripsResource,
  employeesResource,
  customersResource,
  invoicesResource,
  paymentsResource,
  expensesResource,
  maintenanceResource,
  hosEldResource,
  accidentsResource,
  dvirResource,
  documentsResource,
  conversationsResource,
  notificationsResource,
  aiDispatchResource,
  terminalsResource,
  containersResource,
  loadBoardResource,
  productsResource,
];

export const appResourcePageRoutes: ResourcePageRoute[] = [
  ...createResourcePageRoutes(routes.resources.loads, {
    Create: LoadCreate, Edit: LoadEdit, List: LoadList, Show: LoadShow,
  }),
  ...createResourcePageRoutes(routes.resources.trucks, {
    Create: TruckCreate, Edit: TruckEdit, List: TruckList, Show: TruckShow,
  }),
  ...createResourcePageRoutes(routes.resources.trips, {
    Create: TripCreate, Edit: TripEdit, List: TripList, Show: TripShow,
  }),
  ...createResourcePageRoutes(routes.resources.employees, {
    Create: EmployeeCreate, Edit: EmployeeEdit, List: EmployeeList, Show: EmployeeShow,
  }),
  ...createResourcePageRoutes(routes.resources.customers, {
    Create: CustomerCreate, Edit: CustomerEdit, List: CustomerList, Show: CustomerShow,
  }),
  ...createResourcePageRoutes(routes.resources.invoices, {
    Create: InvoiceCreate, Edit: InvoiceEdit, List: InvoiceList, Show: InvoiceShow,
  }),
  ...createResourcePageRoutes(routes.resources.payments, {
    Create: PaymentCreate, Edit: PaymentEdit, List: PaymentList, Show: PaymentShow,
  }),
  ...createResourcePageRoutes(routes.resources.expenses, {
    Create: ExpenseCreate, Edit: ExpenseEdit, List: ExpenseList, Show: ExpenseShow,
  }),
  ...createResourcePageRoutes(routes.resources.maintenance, {
    Create: MaintenanceCreate, Edit: MaintenanceEdit, List: MaintenanceList, Show: MaintenanceShow,
  }),
  ...createResourcePageRoutes(routes.resources.hosEld, {
    Create: HosEldCreate, Edit: HosEldEdit, List: HosEldList, Show: HosEldShow,
  }),
  ...createResourcePageRoutes(routes.resources.accidents, {
    Create: AccidentCreate, Edit: AccidentEdit, List: AccidentList, Show: AccidentShow,
  }),
  ...createResourcePageRoutes(routes.resources.dvir, {
    Create: DvirCreate, Edit: DvirEdit, List: DvirList, Show: DvirShow,
  }),
  ...createResourcePageRoutes(routes.resources.documents, {
    Create: DocumentCreate, Edit: DocumentEdit, List: DocumentList, Show: DocumentShow,
  }),
  ...createResourcePageRoutes(routes.resources.conversations, {
    Create: ConversationCreate, Edit: ConversationEdit, List: ConversationList, Show: ConversationShow,
  }),
  ...createResourcePageRoutes(routes.resources.notifications, {
    Create: NotificationCreate, Edit: NotificationEdit, List: NotificationList, Show: NotificationShow,
  }),
  ...createResourcePageRoutes(routes.resources.aiDispatch, {
    Create: AiDispatchCreate, Edit: AiDispatchEdit, List: AiDispatchList, Show: AiDispatchShow,
  }),
  ...createResourcePageRoutes(routes.resources.terminals, {
    Create: TerminalCreate, Edit: TerminalEdit, List: TerminalList, Show: TerminalShow,
  }),
  ...createResourcePageRoutes(routes.resources.containers, {
    Create: ContainerCreate, Edit: ContainerEdit, List: ContainerList, Show: ContainerShow,
  }),
  ...createResourcePageRoutes(routes.resources.loadBoard, {
    Create: LoadBoardCreate, Edit: LoadBoardEdit, List: LoadBoardList, Show: LoadBoardShow,
  }),
  ...createResourcePageRoutes(routes.resources.products, {
    Create: ProductCreate, Edit: ProductEdit, List: ProductList, Show: ProductShow,
  }),
];
