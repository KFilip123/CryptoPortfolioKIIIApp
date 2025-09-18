CREATE TABLE IF NOT EXISTS holdings (
                                        id SERIAL PRIMARY KEY,
                                        symbol VARCHAR(16) NOT NULL,
    amount_usd NUMERIC(20,2) NOT NULL,
    initial_amount_usd NUMERIC(20,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

UPDATE holdings
SET initial_amount_usd = amount_usd
WHERE initial_amount_usd IS NULL;
