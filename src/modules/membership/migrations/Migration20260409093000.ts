import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260409093000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "membership_customer_profile" ("id" text not null, "customer_id" text not null, "birthday" timestamptz null, "gender" text check ("gender" in ('male', 'female', 'unknown')) not null default 'unknown', "last_login_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_customer_profile_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_membership_customer_profile_deleted_at" ON "membership_customer_profile" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_membership_customer_profile_customer_id" ON "membership_customer_profile" ("customer_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "membership_customer_profile" cascade;`)
  }
}
