import re
from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Student
        fields = [
            'id',
            'student_id',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'department',
            'year_of_study',
            'gpa',
            'enrollment_status',
            'enrollment_date',
            'address',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def validate_student_id(self, value):
        val = value.strip().upper()
        if not re.match(r'^[A-Z0-9\-]{3,20}$', val):
            raise serializers.ValidationError(
                "Student ID must be 3-20 uppercase alphanumeric characters or hyphens (e.g. STU-2024-001)."
            )
        return val

    def validate_gpa(self, value):
        try:
            val = float(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("GPA must be a valid numeric value.")
        if val < 0.00 or val > 4.00:
            raise serializers.ValidationError("GPA must be between 0.00 and 4.00.")
        return round(val, 2)

    def validate_phone(self, value):
        val = value.strip()
        cleaned = re.sub(r'[\s\-\(\)\+]', '', val)
        if len(cleaned) < 7 or len(cleaned) > 15:
            raise serializers.ValidationError("Phone number must contain between 7 and 15 digits.")
        return val

    def validate_first_name(self, value):
        val = value.strip()
        if len(val) < 2:
            raise serializers.ValidationError("First name must be at least 2 characters.")
        return val

    def validate_last_name(self, value):
        val = value.strip()
        if len(val) < 1:
            raise serializers.ValidationError("Last name cannot be empty.")
        return val
