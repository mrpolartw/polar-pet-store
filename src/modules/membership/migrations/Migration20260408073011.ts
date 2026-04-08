import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260408073011 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "membership_audit_log" ("id" text not null, "actor_type" text check ("actor_type" in ('customer', 'admin', 'system')) not null, "actor_id" text not null, "action" text not null, "target_type" text null, "target_id" text null, "before_state" jsonb null, "after_state" jsonb null, "ip_address" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_audit_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_audit_log_deleted_at" ON "membership_audit_log" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "membership_favorite" ("id" text not null, "customer_id" text not null, "product_id" text not null, "variant_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_favorite_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_favorite_deleted_at" ON "membership_favorite" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "membership_member_level" ("id" text not null, "name" text not null, "rank" integer not null default 0, "min_points" integer not null default 0, "discount_rate" integer not null default 0, "benefits" jsonb null, "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_member_level_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_member_level_deleted_at" ON "membership_member_level" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "membership_oauth_link" ("id" text not null, "customer_id" text not null, "provider" text check ("provider" in ('line', 'google', 'facebook', 'apple')) not null, "provider_user_id" text not null, "provider_email" text null, "access_token" text null, "refresh_token" text null, "token_expires_at" timestamptz null, "raw_profile" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_oauth_link_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_oauth_link_deleted_at" ON "membership_oauth_link" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_membership_oauth_link_customer_provider" ON "membership_oauth_link" ("customer_id", "provider") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_membership_oauth_link_provider_user_id" ON "membership_oauth_link" ("provider", "provider_user_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "membership_pet" ("id" text not null, "customer_id" text not null, "name" text not null, "species" text check ("species" in ('dog', 'cat', 'bird', 'other')) null, "breed" text null, "birthday" timestamptz null, "gender" text check ("gender" in ('male', 'female', 'unknown')) not null default 'unknown', "avatar_url" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_pet_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_pet_deleted_at" ON "membership_pet" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "membership_point_log" ("id" text not null, "customer_id" text not null, "points" integer not null, "balance_after" integer not null default 0, "source" text check ("source" in ('order', 'refund', 'admin', 'expire', 'redeem', 'bonus')) not null, "reference_id" text null, "note" text null, "expired_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_point_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_point_log_deleted_at" ON "membership_point_log" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "membership_subscription" ("id" text not null, "customer_id" text not null, "plan_name" text not null, "status" text check ("status" in ('active', 'paused', 'canceled', 'expired')) not null default 'active', "started_at" timestamptz not null, "expires_at" timestamptz null, "next_billing_at" timestamptz null, "billing_interval" text check ("billing_interval" in ('monthly', 'yearly', 'one_time')) null, "amount" integer null, "currency_code" text not null default 'TWD', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "membership_subscription_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_membership_subscription_deleted_at" ON "membership_subscription" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "membership_audit_log" cascade;`);

    this.addSql(`drop table if exists "membership_favorite" cascade;`);

    this.addSql(`drop table if exists "membership_member_level" cascade;`);

    this.addSql(`drop table if exists "membership_oauth_link" cascade;`);

    this.addSql(`drop table if exists "membership_pet" cascade;`);

    this.addSql(`drop table if exists "membership_point_log" cascade;`);

    this.addSql(`drop table if exists "membership_subscription" cascade;`);
  }

}
