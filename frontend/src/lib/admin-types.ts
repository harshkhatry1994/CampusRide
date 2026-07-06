// ============================================================
// Admin Portal — Shared TypeScript Types
// ============================================================

export type PortalRole = 'super_admin' | 'admin' | 'sales_manager' | 'viewer';

export interface PortalProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  portal_role: PortalRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'CNG' | 'Hybrid';
export type StockStatus = 'Available' | 'Reserved' | 'Sold' | 'Under Maintenance';

export interface DealerBike {
  id: string;
  bike_name: string;
  brand: string;
  model: string;
  model_year: number | null;
  registration_number: string | null;
  chassis_number: string | null;
  engine_number: string | null;
  color: string | null;
  fuel_type: FuelType;
  kms_driven: number;
  purchase_price: number | null;
  selling_price: number | null;
  description: string | null;
  stock_status: StockStatus;
  is_featured: boolean;
  main_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  bike_images?: BikeImage[];
  bike_documents?: BikeDocument[];
}

export interface BikeImage {
  id: string;
  bike_id: string;
  image_url: string;
  is_main: boolean;
  display_order: number;
  created_at: string;
}

export type BikeDocType =
  | 'rc_book'
  | 'insurance'
  | 'pollution_certificate'
  | 'tax_receipt'
  | 'purchase_invoice'
  | 'ownership_transfer'
  | 'sale_agreement'
  | 'service_record';

export interface BikeDocument {
  id: string;
  bike_id: string;
  doc_type: BikeDocType;
  file_url: string | null;
  file_name: string | null;
  upload_date: string;
  expiry_date: string | null;
  status: 'active' | 'expired' | 'pending';
  notes: string | null;
}

export interface DealerCustomer {
  id: string;
  full_name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  aadhaar_number: string | null;
  aadhaar_front_url: string | null;
  aadhaar_back_url: string | null;
  licence_number: string | null;
  licence_front_url: string | null;
  licence_back_url: string | null;
  pan_number: string | null;
  pan_url: string | null;
  passport_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  dealer_sales?: DealerSale[];
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Finance';
export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Refunded';

export interface DealerSale {
  id: string;
  bike_id: string;
  customer_id: string;
  sale_price: number;
  discount: number;
  gst_percentage: number;
  gst_amount: number | null;
  additional_charges: number;
  additional_charges_note: string | null;
  final_amount: number | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  sale_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  dealer_bikes?: DealerBike;
  dealer_customers?: DealerCustomer;
}

export interface DealerInvoice {
  id: string;
  invoice_number: string;
  sale_id: string | null;
  bike_id: string | null;
  customer_id: string | null;
  invoice_url: string | null;
  issued_date: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  created_by: string | null;
  created_at: string;
  // Joined
  dealer_sales?: DealerSale;
  dealer_bikes?: DealerBike;
  dealer_customers?: DealerCustomer;
}

export interface InventoryLog {
  id: string;
  bike_id: string | null;
  action: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'expiry' | 'sale' | 'inventory';

export interface PortalNotification {
  id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  is_read: boolean;
  target_user: string | null;
  related_bike_id: string | null;
  related_sale_id: string | null;
  created_at: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  logo_url: string | null;
  gst_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  invoice_footer: string | null;
  signature_url: string | null;
  created_at: string;
  updated_at: string;
}

// Dashboard stats shape
export interface DashboardStats {
  totalBikes: number;
  availableBikes: number;
  soldBikes: number;
  reservedBikes: number;
  underMaintenanceBikes: number;
  monthlyRevenue: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingDocuments: number;
  insuranceExpiringSoon: number;
  rcExpiringSoon: number;
  totalSales: number;
}

// Role permissions helper
export const ROLE_PERMISSIONS: Record<PortalRole, {
  canManageInventory: boolean;
  canManageCustomers: boolean;
  canManageSales: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canGenerateInvoices: boolean;
  canDeleteRecords: boolean;
  canManageSettings: boolean;
}> = {
  super_admin: {
    canManageInventory: true,
    canManageCustomers: true,
    canManageSales: true,
    canManageUsers: true,
    canViewReports: true,
    canGenerateInvoices: true,
    canDeleteRecords: true,
    canManageSettings: true,
  },
  admin: {
    canManageInventory: true,
    canManageCustomers: true,
    canManageSales: true,
    canManageUsers: false,
    canViewReports: true,
    canGenerateInvoices: true,
    canDeleteRecords: false,
    canManageSettings: false,
  },
  sales_manager: {
    canManageInventory: false,
    canManageCustomers: true,
    canManageSales: true,
    canManageUsers: false,
    canViewReports: true,
    canGenerateInvoices: true,
    canDeleteRecords: false,
    canManageSettings: false,
  },
  viewer: {
    canManageInventory: false,
    canManageCustomers: false,
    canManageSales: false,
    canManageUsers: false,
    canViewReports: true,
    canGenerateInvoices: false,
    canDeleteRecords: false,
    canManageSettings: false,
  },
};
