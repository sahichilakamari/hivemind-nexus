-- HiveMind Nexus — Initial Seed Data
-- Run this once after `pnpm --filter @workspace/db run push`

INSERT INTO agents (name, role, personality, status, productivity_score, avatar_color, model, last_active)
VALUES
  ('CEO Agent',       'CEO',       'Strategic, calm, analytical — sets vision and resolves conflicts',             'idle', 92.0, '#00d4ff', 'llama-3.3-70b-versatile', NOW()),
  ('CTO Agent',       'CTO',       'Technical, precise, forward-thinking — architecture and development planning', 'idle', 88.0, '#7c3aed', 'llama-3.3-70b-versatile', NOW()),
  ('Marketing Agent', 'Marketing', 'Energetic, creative, persuasive — campaigns and brand awareness',             'idle', 85.0, '#f59e0b', 'llama3-70b-8192',          NOW()),
  ('Finance Agent',   'Finance',   'Skeptical, logical, risk-focused — cost analysis and projections',            'idle', 91.0, '#10b981', 'llama-3.3-70b-versatile',  NOW()),
  ('Sales Agent',     'Sales',     'Ambitious, results-driven, customer-focused — outreach and growth',           'idle', 87.0, '#ef4444', 'llama3-70b-8192',          NOW()),
  ('HR Agent',        'HR',        'Empathetic, organized, people-first — workforce and culture',                 'idle', 83.0, '#ec4899', 'llama3-70b-8192',          NOW()),
  ('Support Agent',   'Support',   'Patient, detail-oriented, customer-focused — satisfaction and issues',        'idle', 86.0, '#06b6d4', 'llama3-70b-8192',          NOW()),
  ('Design Agent',    'Design',    'Visual, creative, brand-conscious — branding and UX strategy',                'idle', 89.0, '#f97316', 'llama3-70b-8192',          NOW())
ON CONFLICT DO NOTHING;

INSERT INTO business_metrics (metric_type, value, unit, label, trend)
VALUES
  ('revenue',       124500, 'USD',       'Monthly Revenue',        'up'),
  ('users',           3847, 'users',     'Active Users',           'up'),
  ('market_share',     2.4, '%',         'Market Share',           'up'),
  ('burn_rate',      18200, 'USD/month', 'Burn Rate',              'stable'),
  ('satisfaction',    94.2, '%',         'Customer Satisfaction',  'up'),
  ('growth_rate',     34.7, '%',         'MoM Growth',             'up')
ON CONFLICT DO NOTHING;
