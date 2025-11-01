-- AlterTable
ALTER TABLE "better_jobs"."jobs" ADD COLUMN     "category_id" INTEGER,
ADD COLUMN     "location_id" INTEGER,
ADD COLUMN     "type_id" INTEGER;

-- AddForeignKey
ALTER TABLE "better_jobs"."jobs" ADD CONSTRAINT "jobs_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "better_jobs"."types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "better_jobs"."jobs" ADD CONSTRAINT "jobs_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "better_jobs"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "better_jobs"."jobs" ADD CONSTRAINT "jobs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "better_jobs"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
