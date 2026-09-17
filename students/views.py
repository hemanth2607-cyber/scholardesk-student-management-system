import csv
from django.http import HttpResponse
from django.db.models import Avg, Count, Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Student
from .serializers import StudentSerializer


SAMPLE_STUDENTS = [
    {
        "student_id": "STU-2024-001",
        "first_name": "Eleanor",
        "last_name": "Vance",
        "email": "eleanor.vance@university.edu",
        "phone": "+1 (555) 234-5678",
        "department": "Computer Science & Engineering",
        "year_of_study": 3,
        "gpa": 3.88,
        "enrollment_status": "Active",
        "enrollment_date": "2023-08-20",
        "address": "412 College Avenue, Apt 3B, Cambridge, MA",
    },
    {
        "student_id": "STU-2024-002",
        "first_name": "Marcus",
        "last_name": "Chen",
        "email": "m.chen@university.edu",
        "phone": "+1 (555) 345-6789",
        "department": "Data Science & AI",
        "year_of_study": 4,
        "gpa": 3.95,
        "enrollment_status": "Active",
        "enrollment_date": "2022-08-15",
        "address": "78 University Parkway, Somerville, MA",
    },
    {
        "student_id": "STU-2024-003",
        "first_name": "Amina",
        "last_name": "Al-Mansoor",
        "email": "amina.mansoor@university.edu",
        "phone": "+1 (555) 456-7890",
        "department": "Biotechnology",
        "year_of_study": 2,
        "gpa": 3.72,
        "enrollment_status": "Active",
        "enrollment_date": "2024-08-22",
        "address": "15 Oxford Street, Cambridge, MA",
    },
    {
        "student_id": "STU-2024-004",
        "first_name": "Liam",
        "last_name": "O'Connor",
        "email": "liam.oconnor@university.edu",
        "phone": "+1 (555) 567-8901",
        "department": "Mechanical Engineering",
        "year_of_study": 4,
        "gpa": 3.45,
        "enrollment_status": "Graduated",
        "enrollment_date": "2021-08-25",
        "address": "88 Commonwealth Ave, Boston, MA",
    },
    {
        "student_id": "STU-2024-005",
        "first_name": "Sofia",
        "last_name": "Rodriguez",
        "email": "sofia.r@university.edu",
        "phone": "+1 (555) 678-9012",
        "department": "Information Technology",
        "year_of_study": 2,
        "gpa": 3.65,
        "enrollment_status": "Active",
        "enrollment_date": "2024-08-22",
        "address": "32 Beacon Street, Brookline, MA",
    },
    {
        "student_id": "STU-2024-006",
        "first_name": "Devin",
        "last_name": "Patel",
        "email": "devin.patel@university.edu",
        "phone": "+1 (555) 789-0123",
        "department": "Computer Science & Engineering",
        "year_of_study": 1,
        "gpa": 3.80,
        "enrollment_status": "Active",
        "enrollment_date": "2025-08-18",
        "address": "200 Kirkland House, Cambridge, MA",
    },
    {
        "student_id": "STU-2024-007",
        "first_name": "Clara",
        "last_name": "Lindqvist",
        "email": "clara.lindqvist@university.edu",
        "phone": "+1 (555) 890-1234",
        "department": "Business Administration",
        "year_of_study": 3,
        "gpa": 3.60,
        "enrollment_status": "On Leave",
        "enrollment_date": "2023-08-20",
        "address": "55 Boylston Street, Boston, MA",
    },
    {
        "student_id": "STU-2024-008",
        "first_name": "Tariq",
        "last_name": "Nassir",
        "email": "tariq.nassir@university.edu",
        "phone": "+1 (555) 901-2345",
        "department": "Electrical & Electronics",
        "year_of_study": 3,
        "gpa": 3.15,
        "enrollment_status": "Active",
        "enrollment_date": "2023-08-20",
        "address": "120 Mount Auburn St, Cambridge, MA",
    },
    {
        "student_id": "STU-2024-009",
        "first_name": "Hannah",
        "last_name": "Kim",
        "email": "hannah.kim@university.edu",
        "phone": "+1 (555) 012-3456",
        "department": "Data Science & AI",
        "year_of_study": 2,
        "gpa": 3.91,
        "enrollment_status": "Active",
        "enrollment_date": "2024-08-22",
        "address": "14 Dunster Street, Cambridge, MA",
    },
    {
        "student_id": "STU-2024-010",
        "first_name": "Alexander",
        "last_name": "Wright",
        "email": "alex.wright@university.edu",
        "phone": "+1 (555) 123-4560",
        "department": "Mechanical Engineering",
        "year_of_study": 1,
        "gpa": 2.85,
        "enrollment_status": "Suspended",
        "enrollment_date": "2025-08-18",
        "address": "9 Riverside Drive, Medford, MA",
    },
]


class StudentViewSet(viewsets.ModelViewSet):
    """
    Complete CRUD REST API for Student entity:
    - POST /api/students/ -> Create student
    - GET /api/students/ -> Read all students with search & filter
    - GET /api/students/{id}/ -> Read single student
    - PUT /api/students/{id}/ -> Update student
    - PATCH /api/students/{id}/ -> Partial update student
    - DELETE /api/students/{id}/ -> Delete student
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def get_queryset(self):
        qs = Student.objects.all()

        # Query filters
        department = self.request.query_params.get('department')
        if department:
            qs = qs.filter(department=department)

        status_val = self.request.query_params.get('status')
        if status_val:
            qs = qs.filter(enrollment_status=status_val)

        year = self.request.query_params.get('year')
        if year:
            try:
                qs = qs.filter(year_of_study=int(year))
            except ValueError:
                pass

        # Text search across multiple fields
        search = self.request.query_params.get('search')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(student_id__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(department__icontains=search)
            )

        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        allowed_orderings = [
            'created_at', '-created_at',
            'first_name', '-first_name',
            'last_name', '-last_name',
            'gpa', '-gpa',
            'student_id', '-student_id',
            'enrollment_date', '-enrollment_date'
        ]
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)

        return qs

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Dashboard statistics calculation."""
        total = Student.objects.count()
        active = Student.objects.filter(enrollment_status='Active').count()
        graduated = Student.objects.filter(enrollment_status='Graduated').count()
        on_leave = Student.objects.filter(enrollment_status='On Leave').count()
        suspended = Student.objects.filter(enrollment_status='Suspended').count()
        
        avg_gpa_result = Student.objects.aggregate(avg=Avg('gpa'))
        avg_gpa = round(avg_gpa_result['avg'], 2) if avg_gpa_result['avg'] is not None else 0.00

        dept_counts = list(
            Student.objects.values('department')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        top_dept = dept_counts[0]['department'] if dept_counts else "None"

        return Response({
            "total_students": total,
            "active_students": active,
            "graduated_students": graduated,
            "on_leave_students": on_leave,
            "suspended_students": suspended,
            "average_gpa": avg_gpa,
            "top_department": top_dept,
            "departments": dept_counts
        })

    @action(detail=False, methods=['post'])
    def reset_sample_data(self, request):
        """Seed or reset sample data for quick demonstration and testing."""
        created_count = 0
        updated_count = 0
        for data in SAMPLE_STUDENTS:
            student, created = Student.objects.update_or_create(
                student_id=data['student_id'],
                defaults=data
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        return Response({
            "status": "success",
            "message": f"Sample dataset populated successfully: {created_count} created, {updated_count} updated.",
            "total_records": Student.objects.count()
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export filtered students to CSV format."""
        queryset = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="students_registry_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Student ID', 'First Name', 'Last Name', 'Email',
            'Phone', 'Department', 'Year of Study', 'GPA',
            'Enrollment Status', 'Enrollment Date', 'Address'
        ])

        for s in queryset:
            writer.writerow([
                s.student_id, s.first_name, s.last_name, s.email,
                s.phone, s.department, s.year_of_study, s.gpa,
                s.enrollment_status, s.enrollment_date, s.address
            ])

        return response
