/**
 * English dictionary — single source for the `en` locale.
 *
 * Key paths are unchanged from the former shared + app catalogues, e.g.
 * `actions.retry`, `asyncState.loading`, `bootstrap.unreachable.title`.
 */

const shared = {
  asyncState: {
    loading: "Loading content",
    emptyTitle: "No data",
    emptyDescription: "There is nothing to display yet.",
  },
  queryError: {
    title: "Unable to load content",
    description: "Something went wrong while loading this content.",
  },
  configError: {
    title: "Configuration required",
    description:
      "The application cannot start because its runtime configuration is incomplete or invalid.",
  },
  forbidden: {
    title: "Access denied",
    description: "You do not have permission to view this content.",
  },
  notFound: {
    title: "Page not found",
    description: "The page may have moved or may no longer exist.",
  },
  actions: {
    retry: "Try again",
    goHome: "Go to home",
    confirm: "Confirm",
    cancel: "Cancel",
  },
  confirm: {
    pendingAnnouncement: "The action is in progress.",
  },
} as const;

export const enMessages = {
  ...shared,
  bootstrap: {
    loadingConfig: "Loading application configuration",
    probingHealth: "Checking API availability",
    unreachable: {
      title: "API is unreachable",
      description:
        "The application could not connect to the API. Check the service and try again.",
    },
    corsBlocked: {
      title: "Browser access is blocked",
      description:
        "The API is reachable, but its CORS policy does not allow this application origin.",
    },
    unhealthy: {
      title: "API is not ready",
      description:
        "The API responded but did not report a healthy status.",
    },
    databaseDisabled: {
      title: "Business features are unavailable",
      description:
        "The API is running without database access, so business navigation remains locked.",
    },
    requestId: {
      label: "Request ID",
      copy: "Copy request ID",
      copied: "Request ID copied",
    },
    httpStatus: "HTTP status: {{status}}",
  },
  diagnostics: {
    title: "System diagnostics",
    description:
      "Public, non-sensitive runtime and API availability metadata.",
    fields: {
      environment: "Environment",
      application: "API application",
      profiles: "Active profiles",
      status: "API status",
      database: "Database",
      requestId: "Request ID",
    },
  },
  common: {
    logout: "Sign out",
    changeTenant: "Change company",
    goDashboard: "Go to dashboard",
    select: "Select",
    undo: "Undo",
  },
  auth: {
    introEyebrow: "Run operations with less friction",
    introTitle: "Every shipment, one place.",
    introDescription:
      "Connect your team, vehicles, and customers in one clear, fast operations workspace.",
    systemHealthy: "All systems are operating normally",
    welcome: "Welcome back",
    title: "Sign in to your account",
    description: "Sign in to continue to your dashboard.",
    username: "Work email or username",
    usernamePlaceholder: "you@company.com",
    usernameRequired: "Enter your email or username.",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    passwordRequired: "Enter your password.",
    forgotPassword: "Forgot password?",
    remember: "Remember me on this device",
    signIn: "Sign in",
    continueWith: "or continue with",
    oidcSignIn: "Sign in with Identity Server/Lark",
    protectedBy: "Protected with Authorization Code + PKCE",
    demoReady: "Development account has been prefilled",
    avatarAlt: "Animated polar bear",
    copyright: "© 2026 Logicstic",
    support: "System support",
  },
  dashboard: {
    title: "Dashboard",
    greeting: "Hello {{name}}.",
    fallbackName: "there",
    currentTenant: "Current company",
    noTenant: "Not selected",
    tenantCount: "Companies you can access",
    vehicleCount: "Total vehicles",
    locatedVehicleCount: "Vehicles on map",
    lastKnownData: "Latest available data",
    permissionRequired: "Operational data permission is required",
    operations: {
      title: "Operational scale",
      description: "Current record totals for each operational group.",
      trucks: "Vehicles",
      loads: "Loads",
      trips: "Trips",
    },
    map: {
      title: "Vehicle tracking",
      description:
        "The map shows the latest API locations for up to 100 vehicles, not real-time GPS.",
      ariaLabel: "Map of the latest known vehicle locations",
      loadError: "The vehicle map could not be loaded.",
      noLocation: "No vehicles have valid coordinates yet.",
      visibleCount: "{{count}} vehicles on map",
    },
  },
  tenant: {
    currentLabel: "Current company",
    title: "Current company",
    description:
      "The company is determined by your access token. Changing it requires a new sign-in.",
    none: "Your access token does not contain a valid company.",
    reauthenticate: "Sign in again to change company",
  },
  errors: {
    forbidden: "You do not have permission to access this page.",
    notFound: "The page you requested does not exist.",
  },
  forms: {
    actions: { addStop: "Add stop", removeStop: "Remove stop" },
    validation: {
      required: "This field is required.",
      email: "Enter a valid email address.",
      uuid: "Enter a valid identifier.",
      pattern: "Enter a value in the required format.",
      stopRequired: "Add at least one trip stop.",
    },
    fields: {
      name: "Name", email: "Email", phone: "Phone", status: "Status", notes: "Notes",
      taxId: "Tax ID", isVatExempt: "VAT exempt", addressLine1: "Address line 1",
      addressLine2: "Address line 2", addressCity: "City", addressState: "State/region",
      addressZipCode: "Postal code", addressCountry: "Country", firstName: "First name",
      lastName: "Last name", phoneNumber: "Phone number", salaryType: "Salary type",
      joinedDate: "Joined date", roleId: "Role ID", salaryAmount: "Salary amount",
      salaryCurrency: "Salary currency", code: "UN/LOCODE", countryCode: "Country code",
      type: "Type", number: "Number", vehicleCapacity: "Vehicle capacity", make: "Make",
      model: "Model", year: "Year", vin: "VIN", licensePlate: "License plate",
      licensePlateState: "License plate state", isHazmatPlacarded: "Hazmat placarded",
      mainDriverId: "Main driver ID", secondaryDriverId: "Secondary driver ID",
      adrEquipmentIsAdrCertified: "ADR certified", adrEquipmentAllowedClasses: "ADR allowed classes",
      adrEquipmentOrangePlateNumber: "ADR orange plate number", distance: "Distance",
      isInProximity: "In proximity", customerId: "Customer ID", assignedTruckId: "Assigned truck ID",
      assignedDispatcherId: "Assigned dispatcher ID", source: "Source",
      requestedPickupDate: "Requested pickup date", requestedDeliveryDate: "Requested delivery date",
      isHazmat: "Hazardous material", hazmatClass: "Hazmat class", unNumber: "UN number",
      containerId: "Container ID", originTerminalId: "Origin terminal ID",
      destinationTerminalId: "Destination terminal ID", externalSourceProvider: "External provider",
      externalSourceId: "External source ID", externalBrokerReference: "External broker reference",
      deliveryCostAmount: "Delivery cost", deliveryCostCurrency: "Delivery currency",
      originAddressLine1: "Origin address line 1", originAddressLine2: "Origin address line 2",
      originAddressCity: "Origin city", originAddressState: "Origin state/region",
      originAddressZipCode: "Origin postal code", originAddressCountry: "Origin country",
      originLocationLatitude: "Origin latitude", originLocationLongitude: "Origin longitude",
      destinationAddressLine1: "Destination address line 1", destinationAddressLine2: "Destination address line 2",
      destinationAddressCity: "Destination city", destinationAddressState: "Destination state/region",
      destinationAddressZipCode: "Destination postal code", destinationAddressCountry: "Destination country",
      destinationLocationLatitude: "Destination latitude", destinationLocationLongitude: "Destination longitude",
      totalDistance: "Total distance", truckId: "Truck ID", stops: "Stops", order: "Stop order",
      loadId: "Load ID", locationLatitude: "Latitude", locationLongitude: "Longitude",
      taxBehavior: "Tax behavior", dueDate: "Due date", employeeId: "Employee ID",
      subtotalAmount: "Subtotal", subtotalCurrency: "Subtotal currency", taxTotalAmount: "Tax total",
      taxTotalCurrency: "Tax currency", totalAmount: "Total", totalCurrency: "Total currency",
      periodStart: "Period start", periodEnd: "Period end", totalDistanceDriven: "Distance driven",
      invoiceId: "Invoice ID", amountAmount: "Amount", amountCurrency: "Currency",
      description: "Description", referenceNumber: "Reference number",
      stripePaymentMethodId: "Stripe payment method ID", stripePaymentIntentId: "Stripe payment intent ID",
      recordedAt: "Recorded at", billingAddressLine1: "Billing address line 1",
      billingAddressLine2: "Billing address line 2", billingAddressCity: "Billing city",
      billingAddressState: "Billing state/region", billingAddressZipCode: "Billing postal code",
      billingAddressCountry: "Billing country",
    },
    options: {
      active: "Active", inactive: "Inactive", suspended: "Suspended", hourly: "Hourly",
      salary: "Salary", per_mile: "Per mile", per_load: "Per load", on_leave: "On leave",
      terminated: "Terminated", SEA_PORT: "Sea port", RAIL_TERMINAL: "Rail terminal",
      INLAND_DEPOT: "Inland depot", AIR_CARGO: "Air cargo", BORDER_CROSSING: "Border crossing",
      box_truck: "Box truck", dry_van: "Dry van", flatbed: "Flatbed", reefer: "Reefer",
      tractor: "Tractor", available: "Available", assigned: "Assigned", in_transit: "In transit",
      maintenance: "Maintenance", out_of_service: "Out of service", container: "Container",
      vehicle: "Vehicle", draft: "Draft", dispatched: "Dispatched", picked_up: "Picked up",
      delivered: "Delivered", cancelled: "Cancelled", manual: "Manual",
      customer_portal: "Customer portal", load_board: "Load board", api: "API",
      completed: "Completed", customer: "Customer", payroll: "Payroll",
      subscription: "Subscription", credit_note: "Credit note", pending_approval: "Pending approval",
      approved: "Approved", sent: "Sent", paid: "Paid", overdue: "Overdue", void: "Void",
      exclusive: "Exclusive", inclusive: "Inclusive", pending: "Pending", processing: "Processing",
      succeeded: "Succeeded", failed: "Failed", refunded: "Refunded",
    },
  },
  resources: {
    dashboard: "Dashboard",
    customers: "Customers",
    employees: "Employees",
    terminals: "Terminals",
    trucks: "Trucks",
    loads: "Loads",
    trips: "Trips",
    invoices: "Invoices",
    payments: "Payments",
    documents: "Documents",
    notifications: "Notifications",
  },
} as const;
