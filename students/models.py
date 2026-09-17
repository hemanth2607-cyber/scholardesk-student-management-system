from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Student(models.Model):
    DEPARTMENT_CHOICES = [
        ('Computer Science & Engineering', 'Computer Science & Engineering'),
        ('Data Science & AI', 'Data Science & AI'),
        ('Information Technology', 'Information Technology'),
        ('Electrical & Electronics', 'Electrical & Electronics'),
        ('Mechanical Engineering', 'Mechanical Engineering'),
        ('Biotechnology', 'Biotechnology'),
        ('Business Administration', 'Business Administration'),
    ]

    YEAR_CHOICES = [
        (1, '1st Year'),
        (2, '2nd Year'),
        (3, '3rd Year'),
        (4, '4th Year'),
    ]

    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Graduated', 'Graduated'),
        ('On Leave', 'On Leave'),
        ('Suspended', 'Suspended'),
    ]

    student_id = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Unique institution student identifier (e.g., STU-2024-001)"
    )
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    email = models.EmailField(
        unique=True,
        db_index=True,
        help_text="Official student email address"
    )
    phone = models.CharField(max_length=25)
    department = models.CharField(max_length=80, choices=DEPARTMENT_CHOICES)
    year_of_study = models.IntegerField(choices=YEAR_CHOICES, default=1)
    gpa = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00')), MaxValueValidator(Decimal('4.00'))],
        help_text="Cumulative Grade Point Average (0.00 - 4.00)"
    )
    enrollment_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Active'
    )
    enrollment_date = models.DateField()
    address = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student_id']),
            models.Index(fields=['email']),
            models.Index(fields=['department']),
            models.Index(fields=['enrollment_status']),
        ]

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name} ({self.department})"
