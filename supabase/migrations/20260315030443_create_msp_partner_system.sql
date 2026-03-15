/*
  # Create MSP Partner Management System

  1. New Tables
    - `msp_partners` - Stores MSP partner information
      - `id` (uuid, primary key)
      - `name` (text) - MSP company name
      - `contact_email` (text) - Primary contact email
      - `revenue_share_pct` (numeric) - Revenue share percentage (0-100)
      - `logo_url` (text, nullable) - Custom logo for white-labeling
      - `primary_color` (text, nullable) - Custom primary color (hex)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `msp_customers` - Join table linking MSPs to their customer accounts
      - `id` (uuid, primary key)
      - `msp_id` (uuid) - Reference to MSP partner
      - `customer_id` (uuid) - Reference to customer user
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - MSP admins can view/manage their assigned customers
    - Customers can only see data they own
    - Proper audit trail with timestamps

  3. Notes
    - Endpoints are charged at $18/endpoint/month
    - Revenue share calculated as: (total_endpoints × $18) × revenue_share_pct
    - White-label options allow MSPs to customize portal appearance
*/

-- Create msp_partners table
CREATE TABLE IF NOT EXISTS msp_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text NOT NULL,
  revenue_share_pct numeric NOT NULL CHECK (revenue_share_pct >= 0 AND revenue_share_pct <= 100),
  logo_url text,
  primary_color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create msp_customers join table
CREATE TABLE IF NOT EXISTS msp_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msp_id uuid NOT NULL REFERENCES msp_partners(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(msp_id, customer_id)
);

-- Update webhooks table to include msp_id for future MSP-level webhooks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhooks' AND column_name = 'msp_id'
  ) THEN
    ALTER TABLE webhooks ADD COLUMN msp_id uuid REFERENCES msp_partners(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on msp_partners table
ALTER TABLE msp_partners ENABLE ROW LEVEL SECURITY;

-- Enable RLS on msp_customers table
ALTER TABLE msp_customers ENABLE ROW LEVEL SECURITY;

-- Policies for msp_partners
CREATE POLICY "MSP admins can view own partner record"
  ON msp_partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'msp_admin'
      AND auth.users.raw_app_meta_data->>'msp_id' = msp_partners.id::text
    )
  );

CREATE POLICY "MSP admins can update own partner record"
  ON msp_partners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'msp_admin'
      AND auth.users.raw_app_meta_data->>'msp_id' = msp_partners.id::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'msp_admin'
      AND auth.users.raw_app_meta_data->>'msp_id' = msp_partners.id::text
    )
  );

-- Policies for msp_customers
CREATE POLICY "MSP admins can view their customers"
  ON msp_customers FOR SELECT
  TO authenticated
  USING (
    msp_id IN (
      SELECT (auth.users.raw_app_meta_data->>'msp_id')::uuid
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'msp_admin'
    )
  );

CREATE POLICY "MSP admins can insert customers"
  ON msp_customers FOR INSERT
  TO authenticated
  WITH CHECK (
    msp_id IN (
      SELECT (auth.users.raw_app_meta_data->>'msp_id')::uuid
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'msp_admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_msp_customers_msp_id ON msp_customers(msp_id);
CREATE INDEX IF NOT EXISTS idx_msp_customers_customer_id ON msp_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_msp_id ON webhooks(msp_id);
