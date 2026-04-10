import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260410163000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "membership_customer_profile" add column if not exists "email_verified_at" timestamptz null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "membership_customer_profile" drop column if exists "email_verified_at";`
    )
  }
}
