from django.core.management.base import BaseCommand
from students.models import Student
from students.views import SAMPLE_STUDENTS


class Command(BaseCommand):
    help = 'Seeds database with realistic student records for demonstration and testing'

    def handle(self, *args, **kwargs):
        created = 0
        updated = 0
        for data in SAMPLE_STUDENTS:
            _, is_new = Student.objects.update_or_create(
                student_id=data['student_id'],
                defaults=data
            )
            if is_new:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded students: {created} created, {updated} updated. Total: {Student.objects.count()}'
            )
        )
