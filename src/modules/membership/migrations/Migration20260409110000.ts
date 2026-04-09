import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260409110000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "sort_order" integer not null default 0;`
    )
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "reward_rate" integer not null default 0;`
    )
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "birthday_reward_rate" integer not null default 0;`
    )
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "upgrade_gift_points" integer not null default 0;`
    )
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "upgrade_threshold" integer not null default 0;`
    )
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "auto_upgrade" boolean not null default false;`
    )
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "can_join_event" boolean not null default false;`
    )

    this.addSql(
      `update "membership_member_level" set "sort_order" = coalesce("rank", 0) where exists (select 1);`
    )
    this.addSql(
      `update "membership_member_level" set "reward_rate" = coalesce("discount_rate", 0) where exists (select 1);`
    )
    this.addSql(
      `update "membership_member_level" set "upgrade_threshold" = coalesce("min_points", 0) where exists (select 1);`
    )

    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "rank";`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "min_points";`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "discount_rate";`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "benefits";`
    )

    this.addSql(
      `update "membership_customer_profile" set "gender" = 'other' where "gender" = 'unknown';`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" drop constraint if exists "membership_customer_profile_gender_check";`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" add constraint "membership_customer_profile_gender_check" check ("gender" in ('male', 'female', 'other'));`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" alter column "gender" set default 'other';`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "rank" integer not null default 0;`
    )
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "min_points" integer not null default 0;`
    )
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "discount_rate" integer not null default 0;`
    )
    this.addSql(
      `alter table if exists "membership_member_level" add column if not exists "benefits" jsonb null;`
    )
    this.addSql(
      `update "membership_member_level" set "rank" = coalesce("sort_order", 0) where exists (select 1);`
    )
    this.addSql(
      `update "membership_member_level" set "min_points" = coalesce("upgrade_threshold", 0) where exists (select 1);`
    )
    this.addSql(
      `update "membership_member_level" set "discount_rate" = coalesce("reward_rate", 0) where exists (select 1);`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "sort_order";`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "reward_rate";`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "birthday_reward_rate";`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "upgrade_gift_points";`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "upgrade_threshold";`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "auto_upgrade";`
    )
    this.addSql(
      `alter table if exists "membership_member_level" drop column if exists "can_join_event";`
    )

    this.addSql(
      `update "membership_customer_profile" set "gender" = 'unknown' where "gender" = 'other';`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" drop constraint if exists "membership_customer_profile_gender_check";`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" add constraint "membership_customer_profile_gender_check" check ("gender" in ('male', 'female', 'unknown'));`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" alter column "gender" set default 'unknown';`
    )
  }
}
