/*
  # Create alerts and webhooks tables for RansomRadar

  1. New Tables
    - `alerts` - Stores ransomware detection alerts
      - `id` (uuid, primary key)
      - `endpoint_name` (text) - Name of the monitored endpoint
      - `alert_type` (text) - Type of alert (ransomware, suspicious_activity, etc)
      - `message` (text) - Detailed alert message
      - `severity` (text) - critical, high, medium, low
      - `detected_at` (timestamp) - When alert was detected
      - `created_at` (timestamp) - When record was created
    
    - `webhooks` - Stores user Slack webhook configurations
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to authenticated user
      - `slack_url` (text) - Slack webhook URL
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own webhooks
    - Public read for alerts (for demonstration)
    - Authenticated users can create/update their webhooks

  3. Notes
    - Alerts table stores critical and high severity alerts
    - Each user maintains their own Slack webhook URL
    - Timestamps use timezone-aware timestamps
*/

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_name text NOT NULL,
  alert_type text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  detected_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slack_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on alerts table
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on webhooks table
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Policies for alerts (public read for demo purposes)
CREATE POLICY "Anyone can view alerts"
  ON alerts FOR SELECT
  USING (true);

-- Policies for webhooks (authenticated users can only access their own)
CREATE POLICY "Users can view own webhook"
  ON webhooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create webhook"
  ON webhooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhook"
  ON webhooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhook"
  ON webhooks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_detected_at ON alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
