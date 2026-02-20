-- Trip payments table for budget/expense tracking
-- Supports any currency including Bitcoin (BTC), USD, EUR, etc.
CREATE TABLE IF NOT EXISTS public.trip_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  payer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by trip
CREATE INDEX IF NOT EXISTS idx_trip_payments_trip_id ON public.trip_payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_payments_user_id ON public.trip_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_payments_created_at ON public.trip_payments(created_at DESC);

-- RLS
ALTER TABLE public.trip_payments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read payments for trips they have access to
-- (For now, allow read of any trip - can tighten when trip membership is implemented)
CREATE POLICY "Authenticated users can read trip payments"
  ON public.trip_payments FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert their own payments
CREATE POLICY "Authenticated users can insert own trip payments"
  ON public.trip_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own payments
CREATE POLICY "Authenticated users can update own trip payments"
  ON public.trip_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own payments
CREATE POLICY "Authenticated users can delete own trip payments"
  ON public.trip_payments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.trip_payments IS 'Trip expense/payment tracking. Supports any currency (USD, EUR, BTC, etc.).';
COMMENT ON COLUMN public.trip_payments.amount IS 'Payment amount. Use appropriate precision for currency (e.g. 8 decimals for BTC).';
COMMENT ON COLUMN public.trip_payments.currency IS 'ISO 4217 code or crypto symbol: USD, EUR, GBP, BTC, ETH, etc.';
