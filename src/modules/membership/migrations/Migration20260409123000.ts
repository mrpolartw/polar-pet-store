import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260409123000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `update "membership_customer_profile" set "gender" = 'undisclosed' where "gender" in ('unknown', 'other');`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" drop constraint if exists "membership_customer_profile_gender_check";`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" add constraint "membership_customer_profile_gender_check" check ("gender" in ('male', 'female', 'undisclosed'));`
    )
    this.addSql(
      `alter table if exists "membership_customer_profile" alter column "gender" set default 'undisclosed';`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `update "membership_customer_profile" set "gender" = 'other' where "gender" = 'undisclosed';`
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
}
