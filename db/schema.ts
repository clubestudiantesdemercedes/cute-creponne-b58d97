import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  date,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ---------- USERS & AUTH ----------

export const users = pgTable('users', {
  id: serial().primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // admin | encargado | control_ingreso | consulta
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Sessions are handled via a signed/encrypted cookie (see src/lib/session.server.ts),
// so no sessions table is needed.

// ---------- PEOPLE ----------

export const people = pgTable(
  'people',
  {
    id: serial().primaryKey(),
    dni: text('dni').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    birthDate: date('birth_date'),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    notes: text('notes'),
    status: text('status').notNull().default('activo'), // activo | inactivo
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('people_dni_idx').on(t.dni)],
)

// ---------- MEMBERS ----------

export const members = pgTable(
  'members',
  {
    id: serial().primaryKey(),
    personId: integer('person_id').notNull().references(() => people.id),
    memberNumber: text('member_number').notNull(),
    memberStatus: text('member_status').notNull().default('activo'), // activo | inactivo
    category: text('category').notNull().default('general'), // general | deportista
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('members_number_idx').on(t.memberNumber),
    uniqueIndex('members_person_idx').on(t.personId),
  ],
)

// ---------- FAMILIES ----------

export const families = pgTable('families', {
  id: serial().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const familyMembers = pgTable(
  'family_members',
  {
    id: serial().primaryKey(),
    familyId: integer('family_id').notNull().references(() => families.id),
    personId: integer('person_id').notNull().references(() => people.id),
    relationship: text('relationship'),
  },
  (t) => [uniqueIndex('family_member_idx').on(t.familyId, t.personId)],
)

// ---------- CONVENTIONS ----------

export const conventions = pgTable('conventions', {
  id: serial().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // empresa | sindicato | institucion | otro
  description: text('description'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  status: text('status').notNull().default('activo'), // activo | inactivo
  maxBeneficiaries: integer('max_beneficiaries'),
  benefit: text('benefit'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const conventionBeneficiaries = pgTable(
  'convention_beneficiaries',
  {
    id: serial().primaryKey(),
    conventionId: integer('convention_id').notNull().references(() => conventions.id),
    personId: integer('person_id').notNull().references(() => people.id),
    employeeCode: text('employee_code'),
    status: text('status').notNull().default('activo'), // activo | inactivo
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('convention_person_idx').on(t.conventionId, t.personId)],
)

// ---------- PLANS & PRICES ----------

export const plans = pgTable('plans', {
  id: serial().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  durationValue: integer('duration_value').notNull().default(1),
  durationUnit: text('duration_unit').notNull().default('dia'), // dia | temporada
  seasonStart: date('season_start'),
  seasonEnd: date('season_end'),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const prices = pgTable(
  'prices',
  {
    id: serial().primaryKey(),
    planId: integer('plan_id').notNull().references(() => plans.id),
    conditionType: text('condition_type').notNull(), // socio | deportista | no_socio | convenio
    conventionId: integer('convention_id').references(() => conventions.id),
    amount: integer('amount').notNull(), // whole ARS pesos
    active: boolean('active').notNull().default(true),
  },
  (t) => [
    uniqueIndex('price_unique_idx').on(t.planId, t.conditionType, t.conventionId),
  ],
)

// ---------- SALES ----------

export const sales = pgTable('sales', {
  id: serial().primaryKey(),
  saleNumber: text('sale_number').notNull().unique(),
  createdByUserId: integer('created_by_user_id').notNull().references(() => users.id),
  totalAmount: integer('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // efectivo | transferencia | mercadopago | tarjeta | otro
  status: text('status').notNull().default('pagada'), // pagada | anulada
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const saleItems = pgTable('sale_items', {
  id: serial().primaryKey(),
  saleId: integer('sale_id').notNull().references(() => sales.id),
  personId: integer('person_id').notNull().references(() => people.id),
  conditionType: text('condition_type').notNull(), // socio | deportista | no_socio | convenio
  conventionId: integer('convention_id').references(() => conventions.id),
  planId: integer('plan_id').notNull().references(() => plans.id),
  unitPrice: integer('unit_price').notNull(),
})

// ---------- PAYMENTS ----------

export const payments = pgTable('payments', {
  id: serial().primaryKey(),
  saleId: integer('sale_id').notNull().references(() => sales.id),
  amount: integer('amount').notNull(),
  method: text('method').notNull(),
  status: text('status').notNull().default('confirmado'), // confirmado | anulado
  createdByUserId: integer('created_by_user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ---------- PERMITS & QR ----------

export const permits = pgTable(
  'permits',
  {
    id: serial().primaryKey(),
    code: text('code').notNull(), // SOC-XXXX | NOC-XXXX
    personId: integer('person_id').notNull().references(() => people.id),
    saleItemId: integer('sale_item_id').notNull().references(() => saleItems.id),
    planId: integer('plan_id').notNull().references(() => plans.id),
    conditionType: text('condition_type').notNull(),
    conventionId: integer('convention_id').references(() => conventions.id),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: text('status').notNull().default('activo'), // activo | vencido | anulado
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('permits_code_idx').on(t.code)],
)

// ---------- ENTRIES ----------

export const entries = pgTable('entries', {
  id: serial().primaryKey(),

  personId: integer('person_id').notNull().references(() => people.id),

  // Optional because an entry to the sports field does not necessarily
  // require a pool permit.
  permitId: integer('permit_id').references(() => permits.id),

  checkedInByUserId: integer('checked_in_by_user_id').notNull().references(() => users.id),

  method: text('method').notNull(), // qr | manual

  // campo_deportes | pileta
  entryType: text('entry_type').notNull().default('campo_deportes'),

  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
})

// ---------- CASH CLOSURES ----------

export const cashClosures = pgTable(
  'cash_closures',
  {
    id: serial().primaryKey(),
    closureDate: date('closure_date').notNull(),
    closedByUserId: integer('closed_by_user_id').references(() => users.id),
    totals: jsonb('totals'), // breakdown by payment method
    salesCount: integer('sales_count').notNull().default(0),
    totalAmount: integer('total_amount').notNull().default(0),
    status: text('status').notNull().default('abierta'), // abierta | cerrada
    closedAt: timestamp('closed_at'),
  },
  (t) => [uniqueIndex('cash_closure_date_idx').on(t.closureDate)],
)

// ---------- AUDIT LOG ----------

export const auditLogs = pgTable('audit_logs', {
  id: serial().primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ---------- APP CONFIG ----------

export const appConfig = pgTable('app_config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
