# Student Management System - GitHub Copilot Instructions

## Project Overview
This is a comprehensive Student Management backend system built with FastAPI, SQLModel, and advanced logging capabilities. The system provides CRUD operations, analytics, data export, and monitoring for student records management.

## Architecture & Technology Stack

### Core Technologies
- **FastAPI 0.104+**: Modern, fast web framework with automatic API documentation
- **SQLModel 0.0.14**: Type-safe database operations with Pydantic integration
- **SQLite**: Development database (production-ready for PostgreSQL migration)
- **Pandas 2.1.4**: Data processing, analytics, and export functionality
- **Python 3.9+**: Modern Python with type hints and async/await

### Project Structure
```
BackendStudentManagement/
├── app/                          # Main application code
│   ├── api/
│   │   └── endpoints/
│   │       └── students.py       # Student CRUD endpoints
│   ├── core/
│   │   ├── config.py             # Application configuration
│   │   ├── database.py           # Database connection & session
│   │   └── logging.py            # Advanced logging system
│   ├── crud/
│   │   └── student.py            # Database operations layer
│   ├── models/
│   │   └── student.py            # SQLModel data models
│   ├── services/
│   │   ├── data_service.py       # Data processing & analytics
│   │   ├── export_service.py     # Multi-format export (CSV, Excel, XML, JSON)
│   │   └── crawler_service.py    # Web scraping capabilities
│   └── main.py                   # FastAPI application entry point
├── docs/                         # 📖 Documentation
│   ├── README.md                 # Complete project documentation
│   ├── DAILY_LOGGING_SYSTEM.md   # Daily logging system guide
│   └── LOGGING_REPORT.md         # Logging implementation details
├── scripts/                      # 🛠️ Utility Scripts
│   ├── run.py                    # Development server runner
│   ├── demo_daily_logging.py     # Daily logging demo
│   ├── setup.bat                 # Windows setup script
│   └── setup.sh                  # Linux/Mac setup script
├── tests/                        # 🧪 Test Files
│   ├── test_api.py               # API endpoint tests
│   ├── test_logging.py           # Logging system tests
│   └── simple_test.py            # Basic functionality tests
├── logs/                         # 📊 Log files (auto-generated)
│   └── YYYY-MM-DD/               # Daily log folders
├── .github/copilot/              # GitHub Copilot instructions
├── uploads/                      # File uploads (auto-generated)
└── requirements.txt              # Python dependencies
```

## Coding Standards & Best Practices

### 1. Code Style & Formatting
- **Follow PEP 8**: Use consistent Python naming conventions
- **Type Hints**: Always use type hints for function parameters and return values
- **Docstrings**: Use Google-style docstrings for all classes and functions
- **Line Length**: Maximum 100 characters per line
- **Import Order**: Standard library → Third-party → Local imports

### 2. FastAPI Patterns
- **Router Organization**: Use APIRouter for endpoint grouping
- **Dependency Injection**: Leverage FastAPI's dependency system
- **Response Models**: Always define Pydantic response models
- **Error Handling**: Use HTTPException with appropriate status codes
- **Async/Await**: Use async functions for I/O operations

```python
# Example FastAPI endpoint pattern
@router.post("/students", response_model=StudentResponse, status_code=201)
async def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    logger: Logger = Depends(get_logger)
) -> StudentResponse:
    """Create a new student with validation and logging."""
    try:
        result = await student_crud.create(db, student)
        logger.log_student_operation("create", result.student_id, {"full_name": result.full_name})
        return result
    except Exception as e:
        logger.error(f"Failed to create student: {e}")
        raise HTTPException(status_code=400, detail=str(e))
```

### 3. SQLModel & Database Patterns
- **Model Inheritance**: Use base models for shared fields
- **Validation**: Implement custom validators for business rules
- **Relationships**: Define proper foreign key relationships
- **Migration Ready**: Design models for easy database migration

```python
# Example SQLModel pattern
class StudentBase(SQLModel):
    """Base student model with common fields and validation."""
    student_id: str = Field(index=True, regex=r'^[A-Z0-9]{6,12}$')
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    
    @validator('student_id')
    def validate_student_id(cls, v):
        return v.upper().strip()
```

### 4. Logging & Monitoring Standards
- **Structured Logging**: Use JSON format for all application logs
- **Performance Tracking**: Log execution time for database operations
- **Error Context**: Include full context in error logs
- **Log Levels**: Use appropriate log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)

```python
# Example logging pattern
logger.log_database_query("INSERT", "students", duration_ms=23.5, record_count=1)
logger.log_student_operation("create", student_id="SV240001", details={"full_name": "John Doe"})
```

### 5. Error Handling Patterns
- **Custom Exceptions**: Create domain-specific exception classes
- **Graceful Degradation**: Handle failures without crashing
- **User-Friendly Messages**: Provide clear error messages for API consumers
- **Logging Integration**: Always log errors with context

```python
# Example error handling
try:
    student = await student_crud.get_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
    return student
except SQLAlchemyError as e:
    logger.error(f"Database error retrieving student {student_id}: {e}")
    raise HTTPException(status_code=500, detail="Database operation failed")
```

## Data Models & Validation

### Student Model Structure
```python
class StudentBase(SQLModel):
    student_id: str           # 6-12 alphanumeric characters
    first_name: str           # Required, 1-50 characters
    last_name: str            # Required, 1-50 characters  
    email: Optional[str]      # Valid email format
    birth_date: Optional[date] # ISO date format
    hometown: Optional[str]   # Optional location
    math_score: Optional[float]       # 0-10 range
    literature_score: Optional[float] # 0-10 range
    english_score: Optional[float]    # 0-10 range
```

### Computed Properties
- `full_name`: Concatenated first_name + last_name
- `average_score`: Average of available scores
- `grade`: Classification based on average score

## API Design Principles

### 1. RESTful URLs
- `GET /api/v1/students` - List students with pagination
- `POST /api/v1/students` - Create new student
- `GET /api/v1/students/{id}` - Get student by ID
- `PUT /api/v1/students/{id}` - Update student
- `DELETE /api/v1/students/{id}` - Delete student

### 2. Response Format Standards
- **Success**: Always return data with appropriate HTTP status
- **Pagination**: Use consistent pagination structure
- **Errors**: Return error details with problem context
- **Metadata**: Include timestamps and operation context

```python
# Standard response format
{
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
}
```

### 3. Input Validation
- **Schema Validation**: Use Pydantic models for request validation
- **Business Rules**: Implement custom validation logic
- **Sanitization**: Clean and normalize input data
- **Security**: Validate against injection attacks

## Testing Guidelines

### 1. Unit Tests
- Test all CRUD operations independently
- Mock external dependencies
- Validate business logic and edge cases
- Test error handling scenarios

### 2. Integration Tests
- Test API endpoints end-to-end
- Verify database transactions
- Test logging and monitoring integration
- Validate response formats

### 3. Performance Tests
- Measure response times for key endpoints
- Test pagination performance with large datasets
- Monitor memory usage during operations
- Validate logging overhead

## Development Workflow

### 1. Feature Development
1. **Create Feature Branch**: `git checkout -b feature/student-analytics`
2. **Implement Changes**: Follow coding standards and patterns
3. **Add Tests**: Write comprehensive tests for new functionality
4. **Update Documentation**: Update API docs and code comments
5. **Test Locally**: Verify all tests pass and logging works

### 2. Code Review Checklist
- [ ] Follows established code patterns
- [ ] Includes proper error handling
- [ ] Has comprehensive logging
- [ ] Includes unit tests
- [ ] API documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed

### 3. Deployment Preparation
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Log rotation configured
- [ ] Health checks implemented
- [ ] Monitoring alerts configured

## Common Patterns & Examples

### 1. Adding New Endpoint
```python
@router.post("/students/bulk", response_model=List[StudentResponse])
async def create_students_bulk(
    students: List[StudentCreate],
    db: Session = Depends(get_db),
    logger: Logger = Depends(get_logger)
) -> List[StudentResponse]:
    """Create multiple students in a single transaction."""
    start_time = time.time()
    
    try:
        results = await student_crud.create_bulk(db, students)
        duration = (time.time() - start_time) * 1000
        
        logger.log_database_query(
            "BULK_INSERT", "students", 
            duration_ms=duration, 
            record_count=len(results)
        )
        
        return results
    except Exception as e:
        logger.error(f"Bulk create failed: {e}")
        raise HTTPException(status_code=400, detail="Bulk operation failed")
```

### 2. Adding New Service
```python
class AnalyticsService:
    """Service for student data analytics and reporting."""
    
    def __init__(self, logger: Logger):
        self.logger = logger
    
    async def generate_report(self, db: Session) -> Dict[str, Any]:
        """Generate comprehensive student analytics report."""
        start_time = time.time()
        
        try:
            # Analytics logic here
            result = {...}
            
            duration = (time.time() - start_time) * 1000
            self.logger.log_performance_metric("analytics_report", duration)
            
            return result
        except Exception as e:
            self.logger.error(f"Analytics report failed: {e}")
            raise
```

### 3. Database Query Optimization
- Use proper indexes for frequent queries
- Implement query result caching for expensive operations
- Use pagination for large result sets
- Monitor query performance with logging

### 4. Security Best Practices
- Validate all input parameters
- Use parameterized queries (SQLModel handles this)
- Implement rate limiting for API endpoints
- Log security-related events
- Sanitize data before logging (no sensitive info)

## Maintenance & Monitoring

### 1. Log Management
- Monitor log file sizes and rotation
- Set up log aggregation for production
- Create alerts for error patterns
- Regular log analysis for optimization

### 2. Performance Monitoring
- Track API response times
- Monitor database query performance
- Watch memory and CPU usage
- Set up alerting for degraded performance

### 3. Data Backup & Recovery
- Regular database backups
- Test recovery procedures
- Monitor backup integrity
- Document recovery processes

## Deployment Configuration

### Environment Variables
```bash
# Database Configuration
DATABASE_URL=sqlite:///./students.db
DATABASE_ECHO=false

# Logging Configuration  
LOG_LEVEL=INFO
LOG_FILE_SIZE=10485760  # 10MB
LOG_BACKUP_COUNT=5

# API Configuration
API_PREFIX=/api/v1
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Production Considerations
- Use PostgreSQL instead of SQLite
- Configure proper CORS settings
- Set up SSL/TLS termination
- Configure log aggregation (ELK stack)
- Implement health checks
- Set up monitoring and alerting

---

## Quick Reference Commands

```bash
# Start development server
python scripts/run.py

# Run with uvicorn directly
uvicorn app.main:app --host 127.0.0.1 --port 8001

# View logs in real-time (daily folders)
tail -f logs/2025-09-28/api.log
tail -f logs/2025-09-28/database.log

# Search logs by date
grep "database_operation" logs/2025-09-28/database.log | tail -10
grep "ERROR" logs/*/api_errors.log

# Run tests
python tests/test_api.py
python tests/test_logging.py
python tests/simple_test.py

# Demo logging system
python scripts/demo_daily_logging.py

# Setup environment
scripts/setup.bat    # Windows
scripts/setup.sh     # Linux/Mac

# Test API endpoints
curl -X GET "http://127.0.0.1:8001/api/v1/students"
curl -X POST "http://127.0.0.1:8001/api/v1/students" \
     -H "Content-Type: application/json" \
     -d '{"student_id":"SV240001","first_name":"John","last_name":"Doe"}'
```

## Support & Documentation
- **API Documentation**: http://localhost:8001/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8001/redoc (ReDoc)
- **Health Check**: http://localhost:8001/ (Basic health endpoint)

Remember to always follow these patterns and conventions when extending the Student Management System. This ensures code consistency, maintainability, and reliability across the entire project.