import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260409143000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "membership_point_log" add column if not exists "metadata" jsonb null;`
    )
    this.addSql(
      `alter table if exists "membership_point_log" drop constraint if exists "membership_point_log_source_check";`
    )
    this.addSql(
      `alter table if exists "membership_point_log" add constraint "membership_point_log_source_check" check ("source" in ('order', 'birthday_bonus', 'refund', 'admin', 'expire', 'redeem', 'bonus', 'upgrade_gift'));`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "membership_point_log" drop constraint if exists "membership_point_log_source_check";`
    )
    this.addSql(
      `alter table if exists "membership_point_log" add constraint "membership_point_log_source_check" check ("source" in ('order', 'refund', 'admin', 'expire', 'redeem', 'bonus'));`
    )
    this.addSql(
      `alter table if exists "membership_point_log" drop column if exists "metadata";`
    )
  }
}
