from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from students.models import Student


class StudentCRUDTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student_data = {
            "student_id": "STU-2024-100",
            "first_name": "Jordan",
            "last_name": "Miller",
            "email": "jordan.miller@university.edu",
            "phone": "+1 (555) 321-4321",
            "department": "Computer Science & Engineering",
            "year_of_study": 2,
            "gpa": 3.75,
            "enrollment_status": "Active",
            "enrollment_date": "2024-09-01",
            "address": "12 Elm Street, Boston, MA"
        }
        self.student = Student.objects.create(**self.student_data)

    def test_create_student_success(self):
        """Test POST /api/students/ creates a new student with valid data."""
        payload = {
            "student_id": "STU-2024-101",
            "first_name": "Avery",
            "last_name": "Brooks",
            "email": "avery.brooks@university.edu",
            "phone": "+1 (555) 432-5432",
            "department": "Data Science & AI",
            "year_of_study": 1,
            "gpa": 3.90,
            "enrollment_status": "Active",
            "enrollment_date": "2025-09-01",
            "address": "45 Oak Ave, Cambridge, MA"
        }
        response = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['student_id'], 'STU-2024-101')
        self.assertEqual(response.data['full_name'], 'Avery Brooks')
        self.assertTrue(Student.objects.filter(student_id='STU-2024-101').exists())

    def test_create_duplicate_student_id_fails(self):
        """Test POST rejects duplicate student_id according to unique constraint."""
        payload = self.student_data.copy()
        payload['email'] = 'unique.different@university.edu'
        response = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('student_id', response.data)

    def test_create_duplicate_email_fails(self):
        """Test POST rejects duplicate email according to unique constraint."""
        payload = self.student_data.copy()
        payload['student_id'] = 'STU-2024-999'
        response = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_create_invalid_gpa_range_fails(self):
        """Test POST rejects GPA greater than 4.00 or negative."""
        payload = self.student_data.copy()
        payload['student_id'] = 'STU-2024-102'
        payload['email'] = 'test.gpa@university.edu'
        payload['gpa'] = 4.85
        response = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('gpa', response.data)

        payload['gpa'] = -0.5
        response = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('gpa', response.data)

    def test_create_invalid_email_format_fails(self):
        """Test POST rejects improperly formatted email strings."""
        payload = self.student_data.copy()
        payload['student_id'] = 'STU-2024-103'
        payload['email'] = 'not-an-email-address'
        response = self.client.post('/api/students/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_read_all_students(self):
        """Test GET /api/students/ returns list containing created students."""
        response = self.client.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['student_id'], self.student.student_id)

    def test_read_single_student_success(self):
        """Test GET /api/students/{id}/ returns single student details."""
        response = self.client.get(f'/api/students/{self.student.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.student.id)
        self.assertEqual(response.data['first_name'], 'Jordan')

    def test_read_single_student_not_found(self):
        """Test GET /api/students/{id}/ with non-existent ID returns 404."""
        response = self.client.get('/api/students/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_student_put(self):
        """Test PUT /api/students/{id}/ performs full update."""
        updated_payload = {
            "student_id": "STU-2024-100",
            "first_name": "Jordan",
            "last_name": "Miller-Smith",
            "email": "jordan.miller@university.edu",
            "phone": "+1 (555) 999-8888",
            "department": "Computer Science & Engineering",
            "year_of_study": 3,
            "gpa": 3.92,
            "enrollment_status": "Active",
            "enrollment_date": "2024-09-01",
            "address": "12 Elm Street, Boston, MA"
        }
        response = self.client.put(f'/api/students/{self.student.id}/', updated_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.last_name, "Miller-Smith")
        self.assertEqual(self.student.year_of_study, 3)
        self.assertEqual(float(self.student.gpa), 3.92)

    def test_partial_update_student_patch(self):
        """Test PATCH /api/students/{id}/ updates specific fields."""
        response = self.client.patch(
            f'/api/students/{self.student.id}/',
            {"enrollment_status": "Graduated", "gpa": 3.85},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.enrollment_status, "Graduated")
        self.assertEqual(float(self.student.gpa), 3.85)

    def test_delete_student_success(self):
        """Test DELETE /api/students/{id}/ removes record from database."""
        response = self.client.delete(f'/api/students/{self.student.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Student.objects.filter(id=self.student.id).exists())

    def test_delete_non_existent_student(self):
        """Test DELETE on non-existent record returns 404."""
        response = self.client.delete('/api/students/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_and_search(self):
        """Test search and query filters."""
        # Create second student
        Student.objects.create(
            student_id="STU-2024-200",
            first_name="Beatrice",
            last_name="Webb",
            email="beatrice.webb@university.edu",
            phone="+1 (555) 777-6666",
            department="Biotechnology",
            year_of_study=1,
            gpa=3.60,
            enrollment_status="Active",
            enrollment_date="2025-08-15"
        )

        # Search by name
        res_search = self.client.get('/api/students/?search=Beatrice')
        self.assertEqual(len(res_search.data), 1)
        self.assertEqual(res_search.data[0]['first_name'], "Beatrice")

        # Filter by department
        res_dept = self.client.get('/api/students/?department=Biotechnology')
        self.assertEqual(len(res_dept.data), 1)
        self.assertEqual(res_dept.data[0]['department'], "Biotechnology")

    def test_stats_endpoint(self):
        """Test GET /api/students/stats/ returns aggregated calculations."""
        response = self.client.get('/api/students/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_students', response.data)
        self.assertIn('average_gpa', response.data)
        self.assertIn('departments', response.data)
