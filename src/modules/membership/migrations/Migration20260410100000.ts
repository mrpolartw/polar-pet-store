import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260410100000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "membership_customer_profile" add column if not exists "email_verified_at" timestamptz null;`
    )

    this.addSql(`
      create table if not exists "membership_customer_auth_token" (
        "id" text not null,
        "customer_id" text null,
        "auth_identity_id" text null,
        "token_type" text check ("token_type" in ('email_verification', 'password_reset', 'line_oauth_state', 'line_pending_email')) not null,
        "token_hash" text not null,
        "expires_at" timestamptz not null,
        "used_at" timestamptz null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "membership_customer_auth_token_pkey" primary key ("id"),
        constraint "membership_customer_auth_token_token_hash_unique" unique ("token_hash")
      );
    `)

    this.addSql(
      `create index if not exists "IDX_membership_customer_auth_token_hash" on "membership_customer_auth_token" ("token_hash") where deleted_at is null;`
    )
    this.addSql(
      `create index if not exists "IDX_membership_customer_auth_token_customer_type" on "membership_customer_auth_token" ("customer_id", "token_type") where deleted_at is null;`
    )
    this.addSql(
      `create index if not exists "IDX_membership_customer_auth_token_auth_identity_type" on "membership_customer_auth_token" ("auth_identity_id", "token_type") where deleted_at is null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop table if exists "membership_customer_auth_token" cascade;`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" drop column if exists "email_verified_at";`
    )
  }
}
